import Audio from './audio';
import Database from './database'

export default class Core {
	static #cores = [];

	#name = null;
	#module = null;
	#settings = null;

	#state = {
		system: null,
		game: null,
		rom: null,

		started: false,
		sync_id: 0,
		audio: true,
	}

	constructor(name) {
		this.#name = name;
	}

	get settings() { return this.#settings; }

	async init() {
		if (this.#module)
			return;

		const origin = location.origin + location.pathname.replace(/\/$/, '');
		const module = await (await import(`${origin}/modules/lib${this.#name}.js`)).default();

		module.JUN_CoreCreate =             module.cwrap('JUN_CoreCreate',             null,     ['string', 'string']);
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

	async prepare(system, rom) {
		const module = this.#module;
		const state = this.#state;

		state.system = system;
		state.game = rom.replace(/\.[^/.]+$/, '');
		state.rom = rom;

		module.FS.mkdir(`${state.system}`);
		module.FS.mkdir(`${state.system}/${state.game}`);
		module.FS.writeFile(`${state.system}/${state.rom}`, await Database.read(`${state.system}/${state.rom}`));

		for (const path of await Database.list(`${state.system}/${state.game}`)) {
			const file = await Database.read(path);
			if (file) module.FS.writeFile(path, file);
		}
	}

	async #sync() {
		const module = this.#module;
		const state = this.#state;

		for (const name of module.FS.readdir(`${state.system}/${state.game}`)) {
			if (name == '.' || name == '..')
				continue;

			const path = `${state.system}/${state.game}/${name}`;
			const data = module.FS.readFile(path);
			await Database.write(path, data);
		}
	}

	start(variables, graphics) {
		return new Promise(resolve => {
			this.#module.JUN_CoreCreate(this.#state.system, this.#state.rom);
			this.update(variables);
			this.#module.JUN_CoreStartGame();

			this.#state.sync_id = setInterval(() => this.#sync(), 1000);

			const video = graphics.getContext('2d');

			const step = () => {
				if (!this.#module)
					return;

				const module = this.#module;
				const state = this.#state;

				module.JUN_CoreRun(1);

				const frame = module.JUN_CoreGetFrameData();
				const width = module.JUN_CoreGetFrameWidth();
				const height = module.JUN_CoreGetFrameHeight();

				graphics.width = width;
				graphics.height = height;

				const frame_view = new Uint8ClampedArray(module.HEAPU8.buffer, frame, width * height * 4);
				video.putImageData(new ImageData(frame_view, width, height), 0, 0);

				const sample_rate = module.JUN_CoreGetSampleRate();
				Audio.update(sample_rate, 2);

				if (state.audio) {
					const audio = module.JUN_CoreGetAudioData();
					const frames = module.JUN_CoreGetAudioFrames();
					const audio_view = new Float32Array(module.HEAP8.buffer, audio, frames * 2);
					Audio.queue(audio_view);
				}

				if (!state.started) {
					state.started = true;
					resolve();
				}

				window.requestAnimationFrame(step);
			}

			window.requestAnimationFrame(step);
		});
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

	update(variables) {
		if (!this.#module)
			return;

		for (const key in variables)
			this.#module.JUN_CoreSetVariable(key, variables[key]);
	}

	send(device, id, value) {
		if (this.#state.started)
			this.#module.JUN_CoreSetInput(device, id, value);
	}

	save() {
		if (this.#state.started)
			this.#module.JUN_CoreSaveState();
	}

	restore() {
		if (this.#state.started)
			this.#module.JUN_CoreRestoreState();
	}

	audio(enable) {
		this.#state.audio = enable;
	}

	async stop() {
		const module = this.#module;
		const state = this.#state;

		clearInterval(state.sync_id);
		state.sync_id = 0;
		state.audio = true;
		state.started = false;

		await this.#sync();

		for (const name of module.FS.readdir(`${state.system}/${state.game}`)) {
			if (name == '.' || name == '..')
				continue;

			module.FS.unlink(`${state.system}/${state.game}/${name}`);
		}

		module.FS.unlink(`${state.system}/${state.rom}`);
		module.FS.rmdir(`${state.system}/${state.game}`);
		module.FS.rmdir(`${state.system}`);

		state.system = null;
		state.game = null;
		state.rom = null;

		module.JUN_CoreDestroy();
		this.#module = null;
	}

	static create(name) {
		if (!this.#cores[name])
			this.#cores[name] = new Core(name);
		return this.#cores[name];
	}

	static async factory() {
		const cores_json = await fetch('cores.json').then(res => res.json());

		const factory = [];
		for (let key in cores_json)
			factory[cores_json[key].name] = async () => {
				const core = Core.create(key);
				await core.init();
				return core;
			}

		return factory;
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
