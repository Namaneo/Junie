import { Cheat } from '../entities/cheat';
import { Settings } from '../entities/settings';
import { Variable } from '../entities/variable';
import Files from './files';
import Audio from './audio';
import Parallel from './parallel';
import Interop from './interop';
import NativeData from './native';
import Graphics from './graphics';

export default class Core {
	/** @type {number} */
	static #INITIAL_MEMORY = 100 * 1024 * 1024;

	/** @type {WebAssembly.Memory} */
	static #memory = new WebAssembly.Memory({
		initial: (this.#INITIAL_MEMORY * 2) / 65536,
		maximum: (this.#INITIAL_MEMORY * 6) / 65536,
		shared: true,
	});

	/** @type {Parallel<Interop>} */
	#parallel = null;

	/** @type {Interop} */
	#interop = null;

	/** @type {string} */
	#name = null;

	/** @type {Graphics} */
	#graphics = null;

	/** @type {NativeData} */
	#native = null;

	/** @type {Parallel[]} */
	#threads = [];

	#state = {
		/** @type {number} */
		speed: 1,

		/** @type {boolean} */
		audio: true,

		/** @type {boolean} */
		stop: false,

		/** @type {Promise} */
		running: null,
	}

	/**
	 * @param {string} name
	 */
	constructor(name) {
		this.#name = name;
	}

	/**
	 * @param {string} system
	 * @param {string} rom
	 * @param {HTMLCanvasElement} canvas
	 */
	async create(system, rom, canvas) {
		this.#graphics = new Graphics(Core.#memory, canvas);

		const origin = location.origin + location.pathname.substring(0, location.pathname.lastIndexOf('/'));
		const script = await (await fetch('worker.js')).text();

		this.#parallel = new Parallel(Interop, false, async message => {
			const id = message.data.id;
			const start_arg = message.data.start_arg;
			const port = message.data.port;

			const child = new Parallel(Interop, false);
			const core = await child.create(`${this.#name}-${id}`, script);
			await core.init(Core.#memory, system, rom, port, origin, start_arg);

			this.#threads.push(child);
		});

		this.#interop = await this.#parallel.create(this.#name, script);

		await this.#interop.init(Core.#memory, system, rom, await Files.clone(), origin);
		await this.#interop.Create(system, rom);

		this.#native = new NativeData(Core.#memory,
			await this.#interop.GetVariables(),
			await this.#interop.GetMedia()
		);
	}

	/**
	 * @param {Settings} settings
	 * @param {Cheat[]} cheats
	 * @returns {Promise<void>}
	 */
	async start(settings, cheats) {
		const state = this.#state;

		await this.settings(settings);
		await this.#interop.StartGame();
		await this.cheats(cheats);

		const pixel_format = await this.#interop.GetPixelFormat();
		const sample_rate = await this.#interop.GetSampleRate();

		this.#graphics.init(pixel_format);

		state.stop = false;
		state.running = new Promise((resolve) => {
			const step = async () => {
				await this.#interop.Run(state.speed);

				const { video, audio } = this.#native.media;

				if (video.frame)
					this.#graphics.draw(video.frame, video.width, video.height, video.pitch, video.ratio);

				if (state.audio) {
					const audio_view = new Float32Array(Core.#memory.buffer, audio.data, audio.frames * 2);
					Audio.queue(audio_view, sample_rate * state.speed, 2);
				}

				state.stop ? resolve() : requestAnimationFrame(step);
			}

			requestAnimationFrame(step);
		});
	}

	/**
	 * @returns {Promise<void>}
	 */
	async stop() {
		const state = this.#state;

		state.stop = true;
		await state.running;
		await this.#interop.Destroy();

		this.#threads.forEach(child => child.close());
		this.#parallel.close();

		new Uint8Array(Core.#memory.buffer).fill(0);
	}

	/**
	 * @returns {Variable[]}
	 */
	variables() {
		return this.#native.variables();
	}

	/**
	 * @param {Settings} settings
	 * @returns {Promise<void>}
	 */
	async settings(settings) {
		for (const key in settings)
			await this.#interop.SetVariable(key, settings[key]);
	}

	/**
	 * @param {Cheat[]} cheats
	 * @returns {Promise<void>}
	 */
	async cheats(cheats) {
		await this.#interop.ResetCheats();
		const filtered = cheats?.filter(x => x.enabled).sort((x, y) => x.order - y.order);
		for (const cheat of filtered ?? [])
			await this.#interop.SetCheat(cheat.order, true, cheat.value);
	}

	/**
	 * @param {number} device
	 * @param {number} id
	 * @param {number} value
	 * @returns {Promise<void>}
	 */
	async send(device, id, value) {
		if (this.#interop)
			await this.#interop.SetInput(device, id, value);
	}

	/**
	 * @returns {Promise<void>}
	 */
	async save() {
		if (this.#interop)
			await this.#interop.SaveState();
	}

	/**
	 * @returns {Promise<void>}
	 */
	async restore() {
		if (this.#interop)
			await this.#interop.RestoreState();
	}

	/**
	 * @param {number} value
	 * @returns {void}
	 */
	speed(value) {
		this.#state.speed = value;
	}

	/**
	 * @param {boolean} enable
	 * @returns {void}
	 */
	audio(enable) {
		this.#state.audio = enable;
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
		static get X()       { return 0; }
		static get Y()       { return 1; }
		static get PRESSED() { return 2; }
		static get COUNT()   { return 3; }
	}
}
