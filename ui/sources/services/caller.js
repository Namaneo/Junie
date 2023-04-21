/** @typedef {('request' | 'response')} MessageType */
class WorkerMessage {
	/** @type {number} */
	id = 0;

	/** @type {MessageType} */
	type = null;

	/**
	 * @param {number} id
	 * @param {MessageType} type
	 */
	constructor(id, type) {
		this.id = id;
		this.type = type
	}
}

class WorkerRequest extends WorkerMessage {
	/** @type {string} */
	name = null;

	/** @type {any[]} */
	parameters = [];

	/** @type {Int32Array} */
	sync = null;

	/**
	 * @param {string} name
	 * @param {any[]} parameters
	 * @param {Int32Array} sync
	 */
	constructor(name, parameters, sync) {
		super(WorkerRequest.#id(), 'request');
		this.name = name;
		this.parameters = parameters;
		this.sync = sync;
	}

	/**
	 * @returns {number}
	 */
	static #id() {
		return Number(String(Math.random()).substring(2));
	}
}

class WorkerResponse extends WorkerMessage {
	/** @type {any} */
	result = null;

	/**
	 * @param {number} id
	 * @param {any} result
	 */
	constructor(id, result) {
		super(id, 'response');
		this.result = result;
	}
}

/**
 * @template T
 * @typedef {(event: MessageEvent<T>) => void} MessageListener
 */
class WorkerLike {
	/** @type {(message: WorkerMessage) => void} */
	postMessage;

	/** @type {(type: 'message', listener: MessageListener<WorkerMessage>) => void} */
	addEventListener;

	/** @type {(type: 'message', listener: MessageListener<WorkerMessage>) => void} */
	removeEventListener;
}

export default class Caller {
	/**
	 * @param {WorkerLike} worker
	 * @param {string} name
	 * @param {...(string | number)} parameters
	 * @returns {Promise<any>}
	 */
	static call(worker, name, ...parameters) {
		if (!worker) return;
		if (!parameters) parameters = [];

		const request = new WorkerRequest(name, parameters);

		return new Promise(resolve => {
			/** @type {MessageListener<WorkerResponse>} */
			const on_message = (event) => {
				if (event.data.id != request.id)
					return;

				worker.removeEventListener('message', on_message);
				resolve(event.data.result);
			}

			worker.addEventListener('message', on_message);
			worker.postMessage(request);
		});
	}

	/**
	 * @param {WorkerLike} worker
	 * @param {string} name
	 * @param {...(string | number)} parameters
	 * @returns {number}
	 */
	static callSync(worker, name, ...parameters) {
		if (!worker) return;
		if (!parameters) parameters = [];

		const sync = new Int32Array(new SharedArrayBuffer(4), 0, 1);
		const request = new WorkerRequest(name, parameters, sync);

		worker.postMessage(request);

		Atomics.wait(sync, 0, 0);
		return Atomics.load(sync, 0);
	}

	/**
	 * @param {WorkerLike} worker
	 * @param {any} object
	 * @param {() => void} callback
	 * @returns {Promise<WorkerResponse>}
	 */
	static async receive(worker, object, callback) {
		/** @type {MessageListener<WorkerRequest>} */
		const on_message = (event) => {
			if (event.data.type != 'request')
				return;

			let result = null;
			if (object[event.data.name])
				result = object[event.data.name](...event.data.parameters)

			if (event.data.sync) {
				Atomics.store(event.data.sync, 0, result);
				Atomics.notify(event.data.sync, 0);

			} else {
				Promise.resolve(result).then(result => {
					callback && callback();
					worker.postMessage(new WorkerResponse(event.data.id, result));
				});
			}
		}

		worker.addEventListener('message', on_message);
	}
}
