/// <reference lib="webworker" />

class AudioProcessor extends AudioWorkletProcessor {
	/** @type {Float32Array[]} */
	#buffers = []

	/** @type {number} */
	#channels = 0;

	constructor(options) {
		super();

		this.#channels = options.outputChannelCount[0];
		this.port.onmessage = message => {
			this.#buffers.push(message.data.frames);
			while (this.#buffers.length > 3)
				this.#buffers.shift();
		}
	}

	process(inputs, outputs, parameters) {
		const left  = outputs[0][0];
		const right = outputs[0][1];

		let index = 0;
		let buffer = null;
		for (let sample = 0; sample < 128; sample++) {
			if (!buffer || index >= buffer.length) {
				index = 0;
				buffer = this.#buffers.shift();
				if (!buffer)
					break;
			}

			left[sample]  = buffer[index + 0];
			right[sample] = buffer[index + 1];
			index += this.#channels;
		}

		if (buffer && buffer.length > index)
			this.#buffers.unshift(buffer.slice(index));

		return true;
	}
  }

  registerProcessor('audio-processor', AudioProcessor);
