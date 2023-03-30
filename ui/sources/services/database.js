import Tools from './tools';

export default class Database {
	static get #name() { return 'Junie' };

	static async list(path) {
		const database = await Tools.database();

		return new Promise(resolve => {
			database.getStore(this.#name, 'readwrite', (_, store) => {
				const request = store.getAllKeys();
				request.onsuccess = (event) => {
					const result = path
						? event.target.result.filter(x => x.startsWith(path))
						: event.target.result;
					resolve(result);
				}
			});
		});
	}

	static async read(path) {
		const database = await Tools.database();

		return new Promise(resolve => {
			database.getFile(this.#name, path, (_, data) => resolve(data));
		});
	}

	static async write(path, data) {
		const database = await Tools.database();

		return new Promise(resolve => {
			database.setFile(this.#name, path, data, () => resolve());
		});
	}

	static async remove(path) {
		const database = await Tools.database();

		return new Promise(resolve => {
			database.deleteFile(this.#name, path, () => resolve());
		});
	}
}
