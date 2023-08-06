const TYPE_NUMBER = 1;
const TYPE_STRING = 2;
const TYPE_OBJECT = 3;

/**
 * @param {MessageEvent} message
 */
async function thread(message) {
	const sab = message.data.args.shift();
	const name = message.data.name;
	const args = message.data.args;

	const result = name != '-ready-' ? await context[name](...args) : 0;

	switch (typeof result) {
		case 'number':
			Atomics.store(sab, 1, TYPE_NUMBER);
			Atomics.store(sab, 2, result);
			break;
		case 'string':
			const encoded_str = new TextEncoder().encode(result);
			sab.buffer.grow(sab.byteLength + encoded_str.byteLength);

			Atomics.store(sab, 1, TYPE_STRING);
			Atomics.store(sab, 2, encoded_str.byteLength);
			new Uint8Array(sab.buffer).set(encoded_str, 12);
			break;
		case 'object':
			const encoded_obj = new TextEncoder().encode(JSON.stringify(result));
			sab.buffer.grow(sab.byteLength + encoded_obj.byteLength);

			Atomics.store(sab, 1, TYPE_OBJECT);
			Atomics.store(sab, 2, encoded_obj.byteLength);
			new Uint8Array(sab.buffer).set(encoded_obj, 12);
			break;
	}

	Atomics.store(sab, 0, 1);
	Atomics.notify(sab, 0, 1);
}

export default class Parallel {
	/** @type {Parallel[]}} */
	static #instances = [];

	/** @type {Worker} */
	#worker = null;

	/** @type {T} */
	#proxy = null;

	/**
	 * @template T
	 * @param {string} name
	 * @param {new() => T} cls
	 * @param {boolean} sync
	 * @returns {Promise<T>}
	 */
	static async create(name, cls, sync) {
		const script = `
			const TYPE_NUMBER = ${TYPE_NUMBER};
			const TYPE_STRING = ${TYPE_STRING};
			const TYPE_OBJECT = ${TYPE_OBJECT};
			const context = new (${cls});
			onmessage = ${thread};
		`;

		const parallel = new Parallel();
		const blob = new Blob([script], { type: 'text/javascript' });
		parallel.#worker = new Worker(URL.createObjectURL(blob), { name });

		await parallel.#call('-ready-', [], false);

		const instance = new cls();
		parallel.#proxy = new Proxy(instance, {
			get: (_, name) => {
				if (instance[name])
					return function() { return parallel.#call(name, arguments, sync); };
				return Reflect.get(instance, ...arguments);
			}
		});

		Parallel.#instances.push(parallel);

		return parallel.#proxy;
	}

	/**
	 * @template T
	 * @param {T} proxy
	 */
	static close(proxy) {
		const index = Parallel.#instances.findIndex(x => x.#proxy == proxy);
		if (index != -1) {
			Parallel.#instances[index].#worker.terminate();
			Parallel.#instances.splice(index, 1);
		}
	}

	#parse(sab) {
		switch (sab[1]) {
			case TYPE_NUMBER:
				return sab[2];
			case TYPE_STRING:
				const str_buf = new Uint8Array(sab.buffer, 12, sab[2]).slice();
				return new TextDecoder().decode(str_buf);
			case TYPE_OBJECT:
				const obj_buf = new Uint8Array(sab.buffer, 12, sab[2]).slice();
				return JSON.parse(new TextDecoder().decode(obj_buf));
		}
	}

	/**
	 * @param {string} name
	 * @param {Array} args
	 * @returns {any | Promise<any>}
	 */
	#call(name, args, sync) {
		if (!args) args = [];

		const sab = new Int32Array(new SharedArrayBuffer(12, { maxByteLength: 4096 }));

		const message = { name, args: [sab, ...args] };
		this.#worker.postMessage(message);

		if (sync) {
			Atomics.wait(sab, 0, 0);
			return this.#parse(sab);
		}

		const result = Atomics.waitAsync(sab, 0, 0);
		return result.async
			? result.value.then(() => this.#parse(sab))
			: this.#parse(sab);
	}
}
