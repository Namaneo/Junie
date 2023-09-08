export default class AudioPlayer {
	/** @type {{ [sample_rate: number]: AudioContext }} */
	static #contexts = {};

	/** @type {{ [sample_rate: number]: AudioWorkletNode }} */
	static #nodes = {};

	/** @type {Promise<void>} */
	static #order = Promise.resolve();

	/**
	 * @param {AudioContext} context
	 * @return {void}
	 */
	static #unlock(context) {
		window.addEventListener('blur', () => context.suspend());
		window.addEventListener('focus', () => setTimeout(() => context.resume(), 250));

		const unlock = () => context.state == 'suspended' && context.resume();
		window.addEventListener('keydown', unlock);
		window.addEventListener('mousedown', unlock);
		window.addEventListener('touchstart', unlock);
	}

	/**
	 * @param {Float32Array} frames
	 * @param {number} sample_rate
	 * @returns {Promise<void>}
	 */
	static async #queue(frames, sample_rate) {
		if (!this.#contexts[sample_rate]) {
			const context = new AudioContext({ sampleRate: sample_rate });
			await context.audioWorklet.addModule('audio-worker.js');
			const node = new AudioWorkletNode(context, 'audio-processor', { outputChannelCount: [2] });
			node.connect(context.destination);

			this.#unlock(context);

			this.#contexts[sample_rate] = context;
			this.#nodes[sample_rate] = node;
		}

		this.#nodes[sample_rate].port.postMessage({ frames: frames }, [frames.buffer]);
	}

	/**
	 * @param {Float32Array} frames
	 * @param {number} sample_rate
	 * @returns {void}
	 */
	static queue(frames, sample_rate) {
		this.#order = this.#order.then(() => this.#queue(frames.slice(), sample_rate));
	}
}
