/**
 * @param {MessageEvent} message
 */
async function thread(message) {
	const sab = message.data.args.shift();
	const name = message.data.name;
	const args = message.data.args;

	const result = name != '-ready-' ? await context[name](...args) : 0;

	Atomics.store(sab, 1, result);
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
	 * @param {new() => T} cls
	 * @param {boolean} sync
	 * @returns {Promise<T>}
	 */
	static async create(cls, sync) {
		const parallel = new Parallel();

		const script = `const context = new (${cls}); onmessage = ${thread};`;
		const blob = new Blob([script], { type: 'text/javascript' });
		parallel.#worker = new Worker(URL.createObjectURL(blob), { name: 'Parallel' });

		const instance = new cls();
		parallel.#proxy = new Proxy(instance, {
			get: (_, name) => {
				if (instance[name])
					return function() { return parallel.#call(name, arguments, [], sync); };
				return Reflect.get(instance, ...arguments);
			}
		});

		Parallel.#instances.push(parallel);
		await parallel.#call('-ready-', [], [], false);
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

	/**
	 * @param {string} name
	 * @param {Array} args
	 * @param {Array} transfer
	 * @returns {number | Promise<number>}
	 */
	#call(name, args, transfer, sync) {
		if (!args) args = [];
		if (!transfer) transfer = [];

		const sab = new Int32Array(new SharedArrayBuffer(8));

		const message = { name, args: [sab, ...args] };
		this.#worker.postMessage(message, transfer);

		if (sync) {
			Atomics.wait(sab, 0, 0);
			return sab[1];
		}

		const result = Atomics.waitAsync(sab, 0, 0);
		return result.async ? result.value.then(() => sab[1]) : sab[1];
	}
}
