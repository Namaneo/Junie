export class Audio {
	/** @type {number} */
	data;

	/** @type {number} */
	frames;

	/**
	 * @param {WebAssembly.Memory} memory
	 * @param {number} ptr
	 * @returns {Audio}
	 */
	static parse(memory, ptr) {
		const view = new DataView(memory.buffer, ptr);

		return {
			data:   view.getUint32(0, true),
			frames: view.getUint32(4, true),
		}
	}
}
