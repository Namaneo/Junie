export class Variable {
	/** @type {string} */
	key;

	/** @type {string} */
	name;

	/** @type {string[]} */
	options;

	/**
	 * @param {WebAssembly.Memory} memory
	 * @param {number} ptr
	 * @returns {Variable[]}
	 */
	static parse(memory, ptr) {
		const view = new DataView(memory.buffer, ptr);

		const str_to_js = (ptr) => {
			const buf = new Uint8Array(memory.buffer, ptr);
			let length = 0; for (; buf[length] != 0; length++);
			return new TextDecoder().decode(buf.slice(0, length));
		}

		let offset = 0;
		const results = [];
		while (true) {
			const key     = view.getUint32(offset + 0, true);
			const name    = view.getUint32(offset + 4, true);
			const options = view.getUint32(offset + 8, true);

			if (!key)
				break;

			results.push({
				key: str_to_js(key),
				name: str_to_js(name),
				options: str_to_js(options).split('|'),
			});

			offset += 16;
		}

		return results;
	}
}
