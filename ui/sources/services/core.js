import Audio from './audio';
import Database from './database'

export default class Core {
	static #cores = [];

	name = null;
	module = null;
	settings = null;
	sync_id = 0;

	system = null;
	game = null;
	rom = null;

	constructor(name) {
		this.name = name;
	}

	async init() {
		if (this.module)
			return;

		const origin = location.origin + location.pathname.replace(/\/$/, '');
		const module = await (await import(`${origin}/modules/lib${this.name}.js`)).default();

		module.JUN_CoreCreate =         module.cwrap('JUN_CoreCreate',         null,     ['string', 'string', 'string']);
		module.JUN_CoreGetDefaults =    module.cwrap('JUN_CoreGetDefaults',    'string', []);
		module.JUN_CoreStartGame =      module.cwrap('JUN_CoreStartGame',      'number', []);
		module.JUN_CoreGetSampleRate =  module.cwrap('JUN_CoreGetSampleRate',  'number', []);
		module.JUN_CoreGetFPS =         module.cwrap('JUN_CoreGetFPS',         'number', []);
		module.JUN_CoreSetInput =       module.cwrap('JUN_CoreSetInput',       null,     ['number', 'number', 'number']);
		module.JUN_CoreRun =            module.cwrap('JUN_CoreRun',            null,     ['number']);
		module.JUN_CoreGetFrameData =   module.cwrap('JUN_CoreGetFrameData',   'number', []);
		module.JUN_CoreGetFrameWidth =  module.cwrap('JUN_CoreGetFrameWidth',  'number', []);
		module.JUN_CoreGetFrameHeight = module.cwrap('JUN_CoreGetFrameHeight', 'number', []);
		module.JUN_CoreGetAudioData =   module.cwrap('JUN_CoreGetAudioData',   'number', []);
		module.JUN_CoreGetAudioFrames = module.cwrap('JUN_CoreGetAudioFrames', 'number', []);
		// module.JUN_CoreSaveState =      module.cwrap('JUN_CoreSaveState',      null,     []);
		// module.JUN_CoreRestoreState =   module.cwrap('JUN_CoreRestoreState',   null,     []);
		// module.JUN_CoreDestroy =        module.cwrap('JUN_CoreDestroy',        null,     []);

		this.module = module;
		this.settings = JSON.parse(module.JUN_CoreGetDefaults());
	}

	async prepare(system, rom) {
		this.system = system;
		this.game = rom.replace(/\.[^/.]+$/, '');
		this.rom = rom;

		this.module.FS.mkdir(`${this.system}`);
		this.module.FS.mkdir(`${this.system}/${this.game}`);
		this.module.FS.writeFile(`${this.system}/${this.rom}`, await Database.read(`${this.system}/${this.rom}`));

		for (const path of await Database.list(`${this.system}/${this.game}`)) {
			const file = await Database.read(path);
			if (file) this.module.FS.writeFile(path, file);
		}
	}

	async #sync() {
		for (const name of this.module.FS.readdir(`${this.system}/${this.game}`)) {
			if (name == '.' || name == '..')
				continue;

			const path = `${this.system}/${this.game}/${name}`;
			const data = this.module.FS.readFile(path);
			await Database.write(path, data);
		}
	}

	start(settings, graphics) {
		this.module.JUN_CoreCreate(this.system, this.rom, JSON.stringify(settings));
		this.module.JUN_CoreStartGame();

		this.sync_id = setInterval(() => this.#sync(), 1000);

		const video = graphics.getContext('2d');

		const step = () => {
			this.module.JUN_CoreRun(1);

			const frame = this.module.JUN_CoreGetFrameData();
			const width = this.module.JUN_CoreGetFrameWidth();
			const height = this.module.JUN_CoreGetFrameHeight();

			graphics.width = width;
			graphics.height = height;

			const frame_view = new Uint8ClampedArray(this.module.HEAPU8.buffer, frame, width * height * 4);
			video.putImageData(new ImageData(frame_view, width, height), 0, 0);

			const sample_rate = this.module.JUN_CoreGetSampleRate();
			Audio.update(sample_rate, 2);

			const audio = this.module.JUN_CoreGetAudioData();
			const frames = this.module.JUN_CoreGetAudioFrames();
			const audio_view = new Float32Array(this.module.HEAP8.buffer, audio, frames * 2);
			Audio.queue(audio_view);

			if (this.sync_id)
				window.requestAnimationFrame(step);
		}

		window.requestAnimationFrame(step);
	}

	send(device, id, value) {
		this.module.JUN_CoreSetInput(device, id, value);
	}

	async stop() {
		clearInterval(this.sync_id);
		this.sync_id = 0;

		await this.#sync();

		for (const name of this.module.FS.readdir(`${this.system}/${this.game}`)) {
			if (name == '.' || name == '..')
				continue;

			this.module.FS.unlink(`${this.system}/${this.game}/${name}`);
		}

		this.module.FS.unlink(`${this.system}/${this.rom}`);
		this.module.FS.rmdir(`${this.system}/${this.game}`);
		this.module.FS.rmdir(`${this.system}`);

		this.system = null;
		this.game = null;
		this.rom = null;
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
}
