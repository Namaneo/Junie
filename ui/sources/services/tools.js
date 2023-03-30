export default class Tools {
	static #module = null;

	static async #create() {
		if (this.#module)
			return this.#module;

		const origin = location.origin + location.pathname.replace(/\/$/, '');
		this.#module = await (await import(`${origin}/modules/tools.js`)).default();
	}

	static async database() {
		await this.#create();

		return this.#module.IDBStore;
	}
}
