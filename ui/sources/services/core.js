import Audio from './audio';
import Database from './database'

export default class Core {
	static #INITIAL_MEMORY = 600 * 1024 * 1024;

	static #memory = new WebAssembly.Memory({
		'initial': this.#INITIAL_MEMORY / 65536,
		'maximum': this.#INITIAL_MEMORY / 65536
	});

	static #cores = [];

	#name = null;
	#module = null;
	#settings = null;

	#state = {
		id: 0,
		rom: null,
		speed: 1,
		audio: true,
		timeout: 0,
	}

	constructor(name) {
		this.#name = name;
	}

	get settings() { return this.#settings; }

	async init() {
		if (this.#module)
			return;

		const origin = location.origin + location.pathname.replace(/\/$/, '');
		const module = await (await import(`${origin}/modules/lib${this.#name}.js`)).default({ wasmMemory: Core.#memory });

		module.JUN_CoreCreate =             module.cwrap('JUN_CoreCreate',             null,     ['string', 'string']);
		module.JUN_CoreGetFileBuffer =      module.cwrap('JUN_CoreGetFileBuffer',      'number', ['string', 'number']),
		module.JUN_CoreCountFiles =         module.cwrap('JUN_CoreCountFiles',         'number', []),
		module.JUN_CoreGetFilePath =        module.cwrap('JUN_CoreGetFilePath',        'string', ['number']),
		module.JUN_CoreGetFileLength =      module.cwrap('JUN_CoreGetFileLength',      'number', ['number']),
		module.JUN_CoreReadFile =           module.cwrap('JUN_CoreReadFile',           'number', ['number']),
		module.JUN_CoreResetCheats =        module.cwrap('JUN_CoreResetCheats',         null,     []);
		module.JUN_CoreSetCheat =           module.cwrap('JUN_CoreSetCheat',           null,     ['number', 'number', 'string']);
		module.JUN_CoreStartGame =          module.cwrap('JUN_CoreStartGame',          'number', []);
		module.JUN_CoreGetSampleRate =      module.cwrap('JUN_CoreGetSampleRate',      'number', []);
		module.JUN_CoreGetVariableCount =   module.cwrap('JUN_CoreGetVariableCount',   'number', []);
		module.JUN_CoreGetVariableKey =     module.cwrap('JUN_CoreGetVariableKey',     'string', ['number']);
		module.JUN_CoreGetVariableName =    module.cwrap('JUN_CoreGetVariableName',    'string', ['number']);
		module.JUN_CoreGetVariableOptions = module.cwrap('JUN_CoreGetVariableOptions', 'string', ['number']);
		module.JUN_CoreSetVariable =        module.cwrap('JUN_CoreSetVariable',        null,     ['string', 'string']);
		module.JUN_CoreSetInput =           module.cwrap('JUN_CoreSetInput',           null,     ['number', 'number', 'number']);
		module.JUN_CoreRun =                module.cwrap('JUN_CoreRun',                null,     ['number']);
		module.JUN_CoreGetFrameData =       module.cwrap('JUN_CoreGetFrameData',       'number', []);
		module.JUN_CoreGetFrameWidth =      module.cwrap('JUN_CoreGetFrameWidth',      'number', []);
		module.JUN_CoreGetFrameHeight =     module.cwrap('JUN_CoreGetFrameHeight',     'number', []);
		module.JUN_CoreGetAudioData =       module.cwrap('JUN_CoreGetAudioData',       'number', []);
		module.JUN_CoreGetAudioFrames =     module.cwrap('JUN_CoreGetAudioFrames',     'number', []);
		module.JUN_CoreSaveState =          module.cwrap('JUN_CoreSaveState',          null,     []);
		module.JUN_CoreRestoreState =       module.cwrap('JUN_CoreRestoreState',       null,     []);
		module.JUN_CoreDestroy =            module.cwrap('JUN_CoreDestroy',            null,     []);

		this.#module = module;
	}

	async #read(path) {
		const module = this.#module;

		const file = await Database.file(path);
		const reader = file.stream().getReader();
		const pointer = module.JUN_CoreGetFileBuffer(path, file.size);
		const data = new Uint8Array(module.HEAPU8.buffer, pointer, file.size);

		let offset = 0;
		await reader.read().then(function process({ done, value }) {
			if (done)
				return;

			data.set(value, offset);
			offset += value.length;

			return reader.read().then(process);
		});
	}

	async prepare(system, rom) {
		const module = this.#module;
		const state = this.#state;

		module.JUN_CoreCreate(system, rom);
		state.rom = `${system}/${rom}`;

		const game_path = `${system}/${rom.replace(/\.[^/.]+$/, '')}`;
		for (const path of await Database.list(game_path))
			await this.#read(path);
	}

	async #sync(loop) {
		if (!this.#module)
			return;

		const module = this.#module;
		const state = this.#state;

		for (let i = 0; i < module.JUN_CoreCountFiles(); i++) {
			const path = module.JUN_CoreGetFilePath(i);
			if (path == state.rom)
				continue;

			const data = module.JUN_CoreReadFile(i);
			const length = module.JUN_CoreGetFileLength(i);

			await Database.write(path, new Uint8Array(module.HEAPU8.buffer, data, length));
		}

		if (loop)
			state.timeout = setTimeout(() => this.#sync(loop), 1000);
	}

	start(graphics, settings, cheats) {
		const module = this.#module;
		const state = this.#state;

		this.settings(settings);
		module.JUN_CoreStartGame();
		this.cheats(cheats);

		module.JUN_CoreRun(1);
		graphics.width = module.JUN_CoreGetFrameWidth();
		graphics.height = module.JUN_CoreGetFrameHeight();

		this.#sync(true);

		const video = graphics.getContext('2d');

		const step = () => {
			module.JUN_CoreRun(state.speed);

			const frame = module.JUN_CoreGetFrameData();
			graphics.width = module.JUN_CoreGetFrameWidth();
			graphics.height = module.JUN_CoreGetFrameHeight();

			const frame_view = new Uint8ClampedArray(module.HEAPU8.buffer, frame, graphics.width * graphics.height * 4);
			video.putImageData(new ImageData(frame_view, graphics.width, graphics.height), 0, 0);

			const sample_rate = module.JUN_CoreGetSampleRate();
			Audio.update(sample_rate * state.speed, 2);

			if (state.audio) {
				const audio = module.JUN_CoreGetAudioData();
				const frames = module.JUN_CoreGetAudioFrames();
				const audio_view = new Float32Array(module.HEAP8.buffer, audio, frames * 2);
				Audio.queue(audio_view);
			}

			state.id = requestAnimationFrame(step);
		}

		state.id = requestAnimationFrame(step);
	}

	async stop() {
		const module = this.#module;
		const state = this.#state;

		cancelAnimationFrame(state.id);
		state.audio = false;

		clearTimeout(state.timeout);
		await this.#sync(false);

		module.JUN_CoreDestroy();
		this.#module = null;

		new Uint8Array(Core.#memory.buffer).fill(0);
	}

	variables() {
		const variables = [];

		if (!this.#module)
			return variables;

		const module = this.#module;

		for (let i = 0; i < module.JUN_CoreGetVariableCount(); i++) {
			const key = module.JUN_CoreGetVariableKey(i);
			const name = module.JUN_CoreGetVariableName(i);
			const options = module.JUN_CoreGetVariableOptions(i).split('|');

			variables.push({ key, name, options });
		}

		return variables;
	}

	settings(settings) {
		if (!this.#module)
			return;

		for (const key in settings)
			this.#module.JUN_CoreSetVariable(key, settings[key]);
	}

	cheats(cheats) {
		if (!this.#module)
			return;

		this.#module.JUN_CoreResetCheats();
		const filtered = cheats?.filter(x => x.enabled).sort((x, y) => x.order - y.order);
		for (const cheat of filtered ?? [])
			this.#module.JUN_CoreSetCheat(cheat.order, true, cheat.value);
	}

	send(device, id, value) {
		if (!this.#module)
			return;

		this.#module.JUN_CoreSetInput(device, id, value);
	}

	save() {
		if (!this.#module)
			return;

		this.#module.JUN_CoreSaveState();
	}

	restore() {
		if (!this.#module)
			return;

		this.#module.JUN_CoreRestoreState();
	}

	speed(value) {
		this.#state.speed = value;
	}

	audio(enable) {
		this.#state.audio = enable;
	}

	static create(name) {
		if (!this.#cores[name])
			this.#cores[name] = new Core(name);
		return this.#cores[name];
	}

	static Device = class {
		static get JOYPAD()  { return 1; }
		static get POINTER() { return 6; }
	}

	static Joypad = class {
		static get B()      { return 0;  }
		static get Y()      { return 1;  }
		static get SELECT() { return 2;  }
		static get START()  { return 3;  }
		static get UP()     { return 4;  }
		static get DOWN()   { return 5;  }
		static get LEFT()   { return 6;  }
		static get RIGHT()  { return 7;  }
		static get A()      { return 8;  }
		static get X()      { return 9;  }
		static get L()      { return 10; }
		static get R()      { return 11; }
	}

	static Pointer = class {
		static get X()       { return 0;  }
		static get Y()       { return 1;  }
		static get PRESSED() { return 2;  }
		static get COUNT()   { return 3;  }
	}
}
