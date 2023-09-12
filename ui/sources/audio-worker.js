class AudioProcessor extends AudioWorkletProcessor {
	/** @type {Int16Array[]} */
	#buffers = []

	/** @type {number} */
	#channels = 0;

	constructor(options) {
		super();

		this.#channels = options.outputChannelCount[0];
		this.port.onmessage = message => {
			this.#buffers.push(message.data);
			let size = this.#buffers.reduce((size, buffer) => size + buffer.length, 0);
			while (size > 150 * Math.round(sampleRate / 1000.0))
				size -= this.#buffers.shift().length;
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

			left[sample]  = buffer[index + 0] / 32768;
			right[sample] = buffer[index + 1] / 32768;
			index += this.#channels;
		}

		if (buffer && buffer.length > index)
			this.#buffers.unshift(buffer.slice(index));

		return true;
	}
}

registerProcessor('audio-processor', AudioProcessor);
