class Core {
	#name = null;
	#module = null;
	#memory = null;
	#canvas = null;

	constructor(name) {
		this.#name = name;
	}

	#wrap(name, type, parameters) {
		this[name] = this.#module.cwrap(`JUN_Core${name}`, type, parameters);;
	}

	/**
	 * @param {WebAssembly.Memory} memory
	 * @param {OffscreenCanvas} canvas
	 */
	async init(memory, canvas) {
		this.#memory = memory;
		this.#canvas = canvas;

		const origin = location.origin + location.pathname.substring(0, location.pathname.lastIndexOf('/'));
		this.#module = await (await import(`${origin}/modules/lib${this.#name}.js`)).default({ wasmMemory: this.#memory });

		this.#wrap('Create',             null,     ['string', 'string']);
		this.#wrap('GetFileBuffer',      'number', ['string', 'number']),
		this.#wrap('CountFiles',         'number', []),
		this.#wrap('GetFilePath',        'string', ['number']),
		this.#wrap('GetFileLength',      'number', ['number']),
		this.#wrap('ReadFile',           'number', ['number']),
		this.#wrap('ResetCheats',         null,     []);
		this.#wrap('SetCheat',           null,     ['number', 'number', 'string']);
		this.#wrap('StartGame',          'number', []);
		this.#wrap('GetSampleRate',      'number', []);
		this.#wrap('GetVariableCount',   'number', []);
		this.#wrap('IsVariableLocked',   'number', ['number']);
		this.#wrap('GetVariableKey',     'string', ['number']);
		this.#wrap('GetVariableName',    'string', ['number']);
		this.#wrap('GetVariableOptions', 'string', ['number']);
		this.#wrap('SetVariable',        null,     ['string', 'string']);
		this.#wrap('SetInput',           null,     ['number', 'number', 'number']);
		this.#wrap('Run',                null,     ['number']);
		this.#wrap('GetFrameData',       'number', []);
		this.#wrap('GetFrameWidth',      'number', []);
		this.#wrap('GetFrameHeight',     'number', []);
		this.#wrap('GetAudioData',       'number', []);
		this.#wrap('GetAudioFrames',     'number', []);
		this.#wrap('SaveState',          null,     []);
		this.#wrap('RestoreState',       null,     []);
		this.#wrap('Destroy',            null,     []);
	}

	/**
	 * @param {OffscreenCanvas} canvas
	 */
	async run(speed) {
		this.Run(speed);

		const frame = this.GetFrameData();
		const width = this.GetFrameWidth();
		const height = this.GetFrameHeight();

		this.#canvas.width = width;
		this.#canvas.height = height;

		if (width == 0 || height == 0)
			return;

		const video = this.#canvas.getContext('2d');
		const frame_view = new Uint8ClampedArray(this.#memory.buffer, frame, width * height * 4);
		video.putImageData(new ImageData(new Uint8ClampedArray(frame_view), width, height), 0, 0);
	}
}

const core = new Core(self.name);
onmessage = async (event) => {
	const response = { id: event.data.id, result: null };

	if (core[event.data.name])
		response.result = core[event.data.name](...event.data.parameters);

	response.result = await Promise.resolve(response.result);
	self.postMessage(response);
};
