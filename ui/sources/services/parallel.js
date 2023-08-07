import WorkerMessage from "./serializer";

/**
 * @template T
 */
export default class Parallel {
	/** @type {new() => T} */
	#cls = null;

	/** @type {boolean} */
	#sync = false;

	/** @type {T} */
	#proxy = null;

	/** @type {Worker | MessagePort} */
	#worker = null;

	/**
	 * @param {new() => T} cls
	 * @param {Worker | MessagePort} worker
	 * @param {boolean} sync
	 */
	constructor(cls, sync) {
		this.#cls = cls;
		this.#sync = sync;

		const instance = new this.#cls();
		this.#proxy = new Proxy(instance, {
			get: (_, name) => {
				if (instance[name]) {
					const parallel = this;
					return function() { return parallel.#call(name, arguments, [], sync); };
				}
				return Reflect.get(instance, ...arguments);
			}
		});
	}

	/**
	 * @param {string} name
	 * @returns {Promise<T>}
	 */
	async create(name) {
		/** @param {MessageEvent} message */
		const process = async (message) => {
			const sab = message.data.args.shift();
			const name = message.data.name;
			const args = message.data.args;

			WorkerMessage.serialize(sab, await context[name](...args));

			Atomics.store(sab, 0, 1);
			Atomics.notify(sab, 0, 1);
		};

		const script = `
			const ${WorkerMessage.name} = ${WorkerMessage};
			const ${Parallel.name} = ${Parallel};

			const context = new (${this.#cls});
			context['-ready-'] = () => { return 0; };
			context['-port-'] = (port) => { port.onmessage = onmessage; return 0; }

			onmessage = ${process};
		`;

		const blob = new Blob([script], { type: 'text/javascript' });
		this.#worker = new Worker(URL.createObjectURL(blob), { name });
		await this.#call('-ready-', [], [], false);
		return this.#proxy;
	}

	/**
	 * @param {MessagePort} port
	 * @returns {Promise<T>}
	 */
	async link(port) {
		this.#worker = port;
		await this.#call('-ready-', [], [], false);
		return this.#proxy;
	}

	/**
	 * @returns {MessagePort | Promise<MessagePort>}
	 */
	open() {
		const channel = new MessageChannel();

		if (this.#sync) {
			this.#call('-port-', [channel.port1], [channel.port1]);
			return channel.port2;
		}

		return this.#call('-port-', [channel.port1], [channel.port1]).then(() => channel.port2);
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
	 * @param {string} name
	 * @param {any[]} args
	 * @param {any[]} transfer
	 * @param {boolean} sync
	 * @returns {any | Promise<any>}
	 */
	#call(name, args, transfer, sync) {
		if (!args) args = [];
		if (!transfer) transfer = [];

		const sab = new Int32Array(new SharedArrayBuffer(12, { maxByteLength: 4096 }));

		const message = { name, args: [sab, ...args] };
		this.#worker.postMessage(message, transfer);

		if (sync) {
			Atomics.wait(sab, 0, 0);
			return WorkerMessage.parse(sab);
		}

		const result = Atomics.waitAsync(sab, 0, 0);
		return result.async
			? result.value.then(() => WorkerMessage.parse(sab))
			: WorkerMessage.parse(sab);
	}
}
