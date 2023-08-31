export class Timing {
	/** @type {number} */
	frames_per_second;

	/** @type {number} */
	sample_rate;

	/**
	 * @param {WebAssembly.Memory} memory
	 * @param {number} ptr
	 * @returns {Timing}
	 */
	static parse(memory, ptr) {
		const view = new DataView(memory.buffer, ptr);

		return {
			frames_per_second: view.getFloat64(0, true),
			sample_rate:       view.getFloat64(8, true),
		}
	}
}
