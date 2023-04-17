class Core {
	/** @type {string} */
	#name = null;

	/** @type {any} */
	#module = null;

	/** @type {WebAssembly.Memory} */
	#memory = null;

	/**
	 * @param {string} name
	 */
	constructor(name) {
		this.#name = name;
	}

	/**
	 * @param {WebAssembly.Memory} memory
	 * @returns {Promise<void>}
	 */
	async init(memory) {
		this.#memory = memory;

		const origin = location.origin + location.pathname.substring(0, location.pathname.lastIndexOf('/'));
		this.#module = await (await import(`${origin}/modules/lib${this.#name}.js`)).default({ wasmMemory: this.#memory });

		const wrap = (name, type, parameters) => {
			this[name] = this.#module.cwrap(`JUN_Core${name}`, type, parameters);;
		}

		wrap('Create',             null,     ['string', 'string']);
		wrap('GetFileBuffer',      'number', ['string', 'number']),
		wrap('CountFiles',         'number', []),
		wrap('GetFilePath',        'string', ['number']),
		wrap('GetFileLength',      'number', ['number']),
		wrap('ReadFile',           'number', ['number']),
		wrap('ResetCheats',         null,     []);
		wrap('SetCheat',           null,     ['number', 'number', 'string']);
		wrap('StartGame',          'number', []);
		wrap('GetSampleRate',      'number', []);
		wrap('GetVariableCount',   'number', []);
		wrap('IsVariableLocked',   'number', ['number']);
		wrap('GetVariableKey',     'string', ['number']);
		wrap('GetVariableName',    'string', ['number']);
		wrap('GetVariableOptions', 'string', ['number']);
		wrap('SetVariable',        null,     ['string', 'string']);
		wrap('SetInput',           null,     ['number', 'number', 'number']);
		wrap('Run',                null,     ['number']);
		wrap('GetFrameData',       'number', []);
		wrap('GetFrameWidth',      'number', []);
		wrap('GetFrameHeight',     'number', []);
		wrap('GetAudioData',       'number', []);
		wrap('GetAudioFrames',     'number', []);
		wrap('SaveState',          null,     []);
		wrap('RestoreState',       null,     []);
		wrap('Destroy',            null,     []);
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
