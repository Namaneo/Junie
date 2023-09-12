export class Audio {
	/** @type {number} */
	data;

	/** @type {number} */
	rate;

	/** @type {number} */
	frames;

	/** @type {boolean} */
	enable;

	/**
	 * @param {WebAssembly.Memory} memory
	 * @param {number} ptr
	 * @returns {Audio}
	 */
	static parse(memory, ptr) {
		const view = new DataView(memory.buffer, ptr);

		return {
			data:   view.getUint32(0, true),
			rate:   view.getFloat32(4, true),
			frames: view.getUint32(8, true),
			enable: view.getUint32(12, true),
		}
	}
}
