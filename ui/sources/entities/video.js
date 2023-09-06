export class Video {
	/** @type {number} */
	data;

	/** @type {number} */
	format;

	/** @type {number} */
	width;

	/** @type {number} */
	height;

	/** @type {number} */
	pitch;

	/** @type {number} */
	ratio;

	/**
	 * @param {WebAssembly.Memory} memory
	 * @param {number} ptr
	 * @returns {Video}
	 */
	static parse(memory, ptr) {
		const view = new DataView(memory.buffer, ptr);

		return {
			data:   view.getUint32(0, true),
			format: view.getUint32(4, true),
			width:  view.getUint32(8, true),
			height: view.getUint32(12, true),
			pitch:  view.getUint32(16, true),
			ratio:  view.getFloat32(20, true),
		}
	}
}
