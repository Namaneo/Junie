// Reworked from: https://github.com/chrisd1100/libmatoya/blob/main/src/unix/web/matoya.js

export default class Audio {
	static #context = new AudioContext();

	static #state = {
		/** @type {boolean} */
		flushing: false,

		/** @type {boolean} */
		playing: false,

		/** @type {number} */
		sample_rate: 0,

		/** @type {number} */
		channels: 0,


		/** @type {number} */
		frames_per_ms: 0,

		/** @type {number} */
		min_buffer: 0,

		/** @type {number} */
		max_buffer: 0,


		/** @type {number} */
		offset: 0,

		/** @type {number} */
		next_time: 0,

		/** @type {Float32Array} */
		buffer: null,
	}

	/**
	 * @return {void}
	 */
	static unlock() {
		window.addEventListener('focus', () => {
			this.#context = new AudioContext();
			this.#state.sample_rate = 0;
			this.#state.channels = 0;
		});

		const unlock = () => this.#context.state == 'suspended' && this.#context.resume();
		window.addEventListener('keydown', unlock);
		window.addEventListener('mousedown', unlock);
		window.addEventListener('touchstart', unlock);
	}

	/**
	 * @param {number} sampleRate
	 * @param {number} channels
	 * @returns {void}
	 */
	static #update(sampleRate, channels) {
		const state = this.#state;

		if (state.sample_rate == sampleRate && state.channels == channels)
			return;

		const framesPerSecond = Math.round(sampleRate / 1000.0);

		this.#state.flushing = false;
		this.#state.playing = false;
		this.#state.sample_rate = sampleRate;
		this.#state.channels = channels;

		this.#state.frames_per_ms = framesPerSecond;
		this.#state.min_buffer = framesPerSecond * 75;
		this.#state.max_buffer = framesPerSecond * 150;

		this.#state.offset = 0;
		this.#state.next_time = 0;
		this.#state.buffer = new Float32Array(sampleRate * channels);
	}

	/**
	 * @param {number} sampleRate
	 * @param {number} channels
	 * @param {Float32Array} frames
	 * @returns {void}
	 */
	static queue(frames, sampleRate, channels) {
		const state = this.#state;

		this.#update(sampleRate, channels);

		const queued = Math.round((state.next_time - this.#context.currentTime) * 1000.0);
		const buffered = Math.round((state.offset / state.channels) / state.frames_per_ms);
		const queued_frames = state.frames_per_ms * (Math.max(queued, 0) + buffered);

		if (queued_frames > state.max_buffer) {
			state.playing = false;
			state.flushing = true;
		}

		if (queued_frames == 0) {
			state.flushing = false;
			state.playing = false;
		}

		if (!state.flushing) {
			state.buffer.set(frames, state.offset);
			state.offset += frames.length;
		}

		if (!state.playing && !state.flushing && state.offset / state.channels > state.min_buffer) {
			state.next_time = this.#context.currentTime;
			state.playing = true;
		}

		if (state.playing) {
			const buffer = this.#context.createBuffer(state.channels, state.offset / state.channels, state.sample_rate);

			for (let channel_id = 0; channel_id < state.channels; channel_id++) {
				const channel = buffer.getChannelData(channel_id);

				for (let offset = channel_id; offset < frames.length; offset += state.channels)
					channel[Math.floor(offset / 2)] = frames[offset];
			}

			const source = this.#context.createBufferSource();
			source.buffer = buffer;
			source.connect(this.#context.destination);
			source.start(state.next_time);

			state.next_time += buffer.duration;
			state.offset = 0;
		}
	}
}
