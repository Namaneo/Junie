// Reworked from: https://github.com/chrisd1100/libmatoya/blob/main/src/unix/web/matoya.js

export default class Audio {
	static #context = new AudioContext();

	static #state = {
		flushing: false,
		playing: false,
		sample_rate: 0,
		channels: 0,

		frames_per_ms: 0,
		min_buffer: 0,
		max_buffer: 0,

		offset: 0,
		next_time: 0,
		buffer: null,
	}


	static unlock() {
		const unlock = () => this.#context.state == 'suspended' && this.#context.resume();
		const events = ['touchstart', 'touchend', 'mousedown', 'keydown'];
		events.forEach(e => document.body.addEventListener(e, unlock));
	}

	static update(sampleRate, channels) {
		const state = this.#state;

		if (state.sample_rate == sampleRate && state.channels == channels)
			return;

		const framesPerSecond = Math.round(sampleRate / 1000.0);

		this.#state =  {
			flushing: false,
			playing: false,
			sample_rate: sampleRate,
			channels: channels,

			frames_per_ms: framesPerSecond,
			min_buffer: framesPerSecond * 75,
			max_buffer: framesPerSecond * 150,

			offset: 0,
			next_time: 0,
			buffer: new Float32Array(sampleRate * channels),
		}
	}

	static queue(frames) {
		const state = this.#state;

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
