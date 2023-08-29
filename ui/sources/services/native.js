import { Video } from "../entities/video";
import { Audio } from "../entities/audio";

export default class Native {
	/** @type {DataView} */
	#video;

	/** @type {DataView} */
	#audio;

	/**
	 * @param {WebAssembly.Memory} memory
	 * @param {number} variables
	 * @param {number} video
	 * @param {number} audio
	 */
	constructor(memory, video, audio) {
		this.#video = new DataView(memory.buffer, video);
		this.#audio = new DataView(memory.buffer, audio);
	}

	/**
	 * @returns {Video}
	 */
	video() {
		return {
			data:   this.#video.getUint32(0, true),
			width:  this.#video.getUint32(4, true),
			height: this.#video.getUint32(8, true),
			pitch:  this.#video.getUint32(12, true),
			ratio:  this.#video.getFloat32(16, true),
		}
	}

	/**
	 * @returns {Audio}
	 */
	audio() {
		return {
			data:   this.#audio.getUint32(0, true),
			frames: this.#audio.getUint32(4, true),
		}
	}
}
