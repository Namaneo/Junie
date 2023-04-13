export default class Database {
	static #db = null;

	static get #name() { return 'Junie'; };
	static get #store() { return 'FILE_DATA'; };

	/**
	 * @param {IDBDatabase} db
	 * @returns {void}
	 */
	static #upgrade(db) {
		db.createObjectStore(this.#store, { keyPath: 'name' });
	}

	/**
	 * @returns {Promise<number>}
	 */
	static async #version() {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(this.#name);

			request.onupgradeneeded = (event) => this.#upgrade(event.target.result);
			request.onerror = (event) => reject(event.target.error);
			request.onsuccess = (event) => {
				resolve(event.target.result.version);
				event.target.result.close();
			}
		});
	}

	/**
	 * @param {string} type
	 * @returns {Promise<IDBObjectStore>}
	 */
	static async #get(type) {
		const transaction = (db) => db
			.transaction([this.#store], type)
			.objectStore(this.#store);

		if (await this.#version() != 1)
			indexedDB.deleteDatabase(this.#name);

		return new Promise((resolve, reject) => {
			if (this.#db)
				return resolve(transaction(this.#db));

			const request = indexedDB.open(this.#name);

			request.onupgradeneeded = (event) => this.#upgrade(event.target.result);
			request.onerror = (event) => reject(event.target.error);
			request.onsuccess = (event) => {
				this.#db = event.target.result;
				resolve(transaction(this.#db));
			};
		});
	}

	/**
	 * @param {String} path
	 * @returns {Promise<string[]>}
	 */
	static async list(path) {
		const store = await this.#get('readonly');

		return new Promise((resolve, reject) => {
			const request = store.getAllKeys();

			request.onerror = (event) => reject(event.target.error);
			request.onsuccess = (event) => resolve(event.target.result.filter(x => !path || x.startsWith(path)));
		});
	}

	/**
	 * @param {String} path
	 * @returns {Promise<File>}
	 */
	static async file(path) {
		const store = await this.#get('readonly');

		return new Promise((resolve, reject) => {
			const request = store.get(path);

			request.onerror = (event) => reject(event.target.error);
			request.onsuccess = (event) => resolve(event.target.result);
		});
	}

	/**
	 * @param {String} path
	 * @returns {Promise<Uint8Array>}
	 */
	static async read(path) {
		const file = await this.file(path);
		const buffer = await file?.arrayBuffer();

		return buffer ? new Uint8Array(buffer) : null;
	}

	/**
	 * @param {String} path
	 * @param {Uint8Array} data
	 * @returns {Promise<void>}
	 */
	static async write(path, data) {
		const store = await this.#get('readwrite');

		return new Promise((resolve, reject) => {
			const request = store.put(new File([data], path));

			request.onerror = (event) => reject(event.target.error);
			request.onsuccess = () => resolve();
		});
	}

	/**
	 * @param {String} path
	 * @returns {Promise<void>}
	 */
	static async remove(path) {
		const store = await this.#get('readwrite');

		return new Promise((resolve, reject) => {
			const request = store.delete(path);

			request.onerror = (event) => reject(event.target.error);
			request.onsuccess = () => resolve();
		});
	}
}
