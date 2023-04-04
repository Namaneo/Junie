export default class Database {
	static get #name() { return 'Junie' };
	static get #store() { return 'FILE_DATA' };

	static async #open() {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(this.#name);

			request.onupgradeneeded = (event) => event.target.result.createObjectStore(this.#store);
			request.onerror = (event) => reject(event.target.error);
			request.onsuccess = (event) => resolve(event.target.result
				.transaction([this.#store], 'readwrite')
				.objectStore(this.#store)
			);
		});
	}

	static async list(path) {
		const store = await this.#open();

		return new Promise((resolve, reject) => {
			const request = store.getAllKeys();

			request.onerror = (event) => reject(event.target.error);
			request.onsuccess = (event) => resolve(event.target.result.filter(x => !path || x.startsWith(path)));
		});
	}

	static async read(path) {
		const store = await this.#open();

		return new Promise((resolve, reject) => {
			const request = store.get(path);

			request.onerror = (event) => reject(event.target.error);
			request.onsuccess = (event) => resolve(event.target.result);
		});
	}

	static async write(path, data) {
		const store = await this.#open();

		return new Promise((resolve, reject) => {
			const request = store.put(data, path);

			request.onerror = (event) => reject(event.target.error);
			request.onsuccess = () => resolve();
		});
	}

	static async remove(path) {
		const store = await this.#open();

		return new Promise((resolve, reject) => {
			const request = store.delete(path);

			request.onerror = (event) => reject(event.target.error);
			request.onsuccess = () => resolve();
		});
	}
}
