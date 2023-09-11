/**
 * @param {any} context
 */
export function instrumentContext(context) {
	const TYPE_NUMBER = 1;
	const TYPE_STRING = 2;
	const TYPE_OBJECT = 3;
	const TYPE_ERROR  = 4;

	context['-ready-'] = () => { return 0; };
	context['-port-'] = (port) => { port.onmessage = onmessage; return 0; };

	return async (message) => {
		const sab = message.data.args.shift();
		const name = message.data.name;
		const args = message.data.args;

		let result = null;
		try {
			result = await context[name](...args);
		} catch(e) {
			result = e;
		}

		switch (typeof result) {
			case 'number':
				Atomics.store(sab, 1, TYPE_NUMBER);
				Atomics.store(sab, 2, result);
				break;
			case 'string':
				const encoded_str = new TextEncoder().encode(result);
				if (sab.buffer.byteLength < 12 + encoded_str.byteLength)
					sab.buffer.grow(12 + encoded_str.byteLength);

				Atomics.store(sab, 1, TYPE_STRING);
				Atomics.store(sab, 2, encoded_str.byteLength);
				new Uint8Array(sab.buffer).set(encoded_str, 12);
				break;
			case 'object':
				const is_error = result?.constructor.name.endsWith('Error');
				const stringified = JSON.stringify(is_error ? result.stack : result);
				const encoded_obj = new TextEncoder().encode(stringified);
				if (sab.buffer.byteLength < 12 + encoded_obj.byteLength)
					sab.buffer.grow(12 + encoded_obj.byteLength);

				Atomics.store(sab, 1, is_error ? TYPE_ERROR : TYPE_OBJECT);
				Atomics.store(sab, 2, encoded_obj.byteLength);
				new Uint8Array(sab.buffer).set(encoded_obj, 12);
				break;
		}

		Atomics.store(sab, 0, 1);
		Atomics.notify(sab, 0, 1);
	}
}

/**
 * @param {SharedArrayBuffer} sab
 * @returns {any}
 */
export function parseMessage(sab) {
	const TYPE_NUMBER = 1;
	const TYPE_STRING = 2;
	const TYPE_OBJECT = 3;
	const TYPE_ERROR  = 4;

	switch (sab[1]) {
		case TYPE_NUMBER:
			return sab[2];
		case TYPE_STRING:
			const str_buf = new Uint8Array(sab.buffer, 12, sab[2]).slice();
			return new TextDecoder().decode(str_buf);
		case TYPE_OBJECT:
			const obj_buf = new Uint8Array(sab.buffer, 12, sab[2]).slice();
			return JSON.parse(new TextDecoder().decode(obj_buf));
		case TYPE_ERROR:
			const error = new Error();
			const err_buf = new Uint8Array(sab.buffer, 12, sab[2]).slice();
			error.stack = JSON.parse(new TextDecoder().decode(err_buf));
			throw error;
		}
}

/**
 * @template T
 */
export default class Parallel {
	/** @type {new() => T} */
	#cls = null;

	/** @type {boolean} */
	#sync = false;

	/** @type {(event: MessageEvent) => void} */
	#handler = false;

	/** @type {T} */
	#proxy = null;

	/** @type {Worker | MessagePort} */
	#worker = null;

	/** @type {Int32Array[]} */
	#buffers = [];

	/**
	 * @param {new() => T} cls
	 * @param {Worker | MessagePort} worker
	 * @param {boolean} sync
	 * @param {(event: MessageEvent) => void} handler
	 */
	constructor(cls, sync, handler) {
		this.#cls = cls;
		this.#sync = sync;
		this.#handler = handler

		const instance = new this.#cls();
		this.#proxy = new Proxy(instance, {
			get: (_, name) => {
				if (instance[name]) {
					const parallel = this;
					return function() { return parallel.#call(name, [...arguments], sync); };
				}
				return Reflect.get(instance, ...arguments);
			}
		});
	}

	/**
	 * @param {string} name
	 * @param {string} script
	 * @returns {Promise<T>}
	 */
	async create(name, script) {
		if (!script)
			script = `onmessage = (${instrumentContext})(new (${this.#cls}));`;

		const blob = new Blob([script], { type: 'text/javascript' });
		this.#worker = new Worker(URL.createObjectURL(blob), { name });
		this.#worker.onmessage = this.#handler;
		await this.#call('-ready-', [], false);
		return this.#proxy;
	}

	/**
	 * @param {MessagePort} port
	 * @returns {T}
	 */
	link(port) {
		this.#worker = port;
		this.#worker.onmessage = this.#handler;
		return this.#proxy;
	}

	/**
	 * @returns {MessagePort | Promise<MessagePort>}
	 */
	open() {
		const channel = new MessageChannel();

		if (this.#sync) {
			this.#call('-port-', [channel.port1]);
			return channel.port2;
		}

		return this.#call('-port-', [channel.port1]).then(() => channel.port2);
	}

	/**
	 * @returns {void}
	 */
	close() {
		const worker = this.#worker;
		if (worker.terminate) worker.terminate();
		if (worker.close) worker.close();
	}

	/**
	 * @param {any} context
	 * @returns {MessagePort}
	 */
	static instrument(context) {
		const channel = new MessageChannel();
		channel.port1.onmessage = instrumentContext(context);
		return channel.port2;
	}

	/**
	 * @param {any} obj
	 * @returns {boolean}
	 */
	#transferable(obj) {
		const instance = ArrayBuffer.isView(obj) ? obj.buffer : obj;
		const types = [MessagePort, OffscreenCanvas, ArrayBuffer];
		if (types.map(type => type.name).includes(instance?.constructor.name))
			return instance;
		return null;
	}

	/**
	 * @param {string} name
	 * @param {any[]} args
	 * @param {boolean} sync
	 * @returns {any | Promise<any>}
	 */
	#call(name, args, sync) {
		if (!args) args = [];

		const sab = this.#buffers.length == 0
			? new Int32Array(new SharedArrayBuffer(12, { maxByteLength: 50 * 1024 }))
			: this.#buffers.pop().fill(0);

		const message = { name, args: [sab, ...args] };
		const transfer = args.map(arg => this.#transferable(arg)).filter(Boolean);
		this.#worker.postMessage(message, transfer);

		if (sync)
			Atomics.wait(sab, 0, 0);

		const wait = sync ? { async: false } : Atomics.waitAsync(sab, 0, 0);

		const parse = () => {
			const result = parseMessage(sab);
			this.#buffers.push(sab);
			return result;
		};

		return wait.async ? wait.value.then(() => parse()) : parse();
	}
}
