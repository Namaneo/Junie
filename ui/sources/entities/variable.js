import Interop from '../services/interop';

export class Variable {
	/** @type {string} */
	key;

	/** @type {string} */
	value;

	/** @type {string} */
	name;

	/** @type {string[]} */
	options;

	/**
	 * @returns {number}
	 */
	static #size() { return 16; };

	/**
	 * @param {WebAssembly.Instance} instance
	 * @param {number} ptr
	 * @returns {Variable[]}
	 */
	static parse(instance, ptr) {
		const view = new DataView(instance.exports.memory.buffer, ptr);

		let offset = 0;
		const results = [];
		while (true) {
			const key     = view.getUint32(offset + 0,  true);
			const value   = view.getUint32(offset + 4,  true);
			const name    = view.getUint32(offset + 8,  true);
			const options = view.getUint32(offset + 12, true);

			if (!key)
				break;

			results.push({
				key:     Interop.deserialize(instance, 'string', key),
				value:   Interop.deserialize(instance, 'string', value),
				name:    Interop.deserialize(instance, 'string', name),
				options: Interop.deserialize(instance, 'string', options)?.split('|'),
			});

			offset += this.#size();
		}

		return results;
	}

	/**
	 * @param {WebAssembly.Instance} instance
	 * @param {Variable[]} variables
	 * @returns {number}
	 */
	static serialize(instance, variables) {
		const ptr = instance.exports.calloc(variables.length + 1, this.#size());
		const view = new DataView(instance.exports.memory.buffer, ptr);

		let offset = 0;
		for (const variable of variables) {
			const key     = Interop.serialize(instance, 'string', variable.key);
			const value   = Interop.serialize(instance, 'string', variable.value);
			const name    = Interop.serialize(instance, 'string', variable.name);
			const options = Interop.serialize(instance, 'string', variable.options?.join('|'));

			view.setUint32(offset + 0,  key,     true);
			view.setUint32(offset + 4,  value,   true);
			view.setUint32(offset + 8,  name,    true);
			view.setUint32(offset + 12, options, true);

			offset += this.#size();
		}

		return ptr;
	}

	/**
	 * @param {WebAssembly.Instance} instance
	 * @param {number} ptr
	 * @returns {void}
	 */
	static free(instance, ptr) {
		const view = new DataView(instance.exports.memory.buffer, ptr);

		let offset = 0;
		while (true) {
			const key     = view.getUint32(offset + 0,  true);
			const value   = view.getUint32(offset + 4,  true);
			const name    = view.getUint32(offset + 8,  true);
			const options = view.getUint32(offset + 12, true);

			if (!key)
				break;

			Interop.free(instance, 'string', key);
			Interop.free(instance, 'string', value);
			Interop.free(instance, 'string', name);
			Interop.free(instance, 'string', options);

			offset += this.#size();
		}

		return ptr;
	}
}
