import { Media } from "../entities/media";
import { Variable } from "../entities/variable";

export default class NativeData {
	/** @type {WebAssembly.Memory} */
	#memory;

	/** @type {DataView} */
	#variables;

	/** @type {DataView} */
	#media;

	/**
	 * @param {WebAssembly.Memory} memory
	 * @param {number} variables
	 * @param {number} media
	 */
	constructor(memory, variables, media) {
		this.#memory = memory;
		this.#variables = new DataView(memory.buffer, variables);
		this.#media = new DataView(memory.buffer, media);
	}

	/**
	 * @param {number} ptr
	 * @returns {string}
	 */
	#str_to_js(ptr) {
		const buf = new Uint8Array(this.#memory.buffer, ptr);
		let length = 0; for (; buf[length] != 0; length++);
		return new TextDecoder().decode(buf.slice(0, length));
	}

	/**
	 * @returns {Variable[]}
	 */
	variables() {
		let offset = 0;
		const results = [];
		while (true) {
			const key     = this.#variables.getUint32(offset + 0, true);
			const name    = this.#variables.getUint32(offset + 4, true);
			const options = this.#variables.getUint32(offset + 8, true);

			if (!key)
				break;

			results.push({
				key: this.#str_to_js(key),
				name: this.#str_to_js(name),
				options: this.#str_to_js(options).split('|'),
			});

			offset += 16;
		}

		return results;
	}

	/**
	 * @returns {Media}
	 */
	media() {
		return {
			video: {
				frame:  this.#media.getUint32(0,  true),
				width:  this.#media.getUint32(4,  true),
				height: this.#media.getUint32(8,  true),
				pitch:  this.#media.getUint32(12, true),
			},
			audio: {
				data:   this.#media.getUint32(16, true),
				frames: this.#media.getUint32(20, true),
			}
		}
	}
}
