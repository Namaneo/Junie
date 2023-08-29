import { Cheat } from '../entities/cheat';
import { Settings } from '../entities/settings';
import { Native } from '../entities/native';
import { Variable } from '../entities/variable';
import { Video } from '../entities/video';
import { Audio } from '../entities/audio';
import Files from './files';
import Parallel from './parallel';
import Graphics from './graphics';
import AudioPlayer from './audio';
import Interop from './interop';

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

	/** @type {Native} */
	#data = null;

	/** @type {Parallel[]} */
	#threads = [];

	/** @type {number} */
	#speed = 1;

	/** @type {boolean} */
	#audio = true;

	/** @type {boolean} */
	#stop = false;

	/** @type {Promise} */
	#running = null;

	get variables() { return Variable.parse(Core.#memory, this.#data.variables); }

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
			await core.init(system, rom, Core.#memory, port, origin, start_arg);

			this.#threads.push(child);
		});

		this.#interop = await this.#parallel.create(this.#name, script);
		await this.#interop.init(system, rom, Core.#memory, await Files.clone(), origin);
		this.#data = await this.#interop.data();
	}

	/**
	 * @param {Settings} settings
	 * @param {Cheat[]} cheats
	 * @returns {Promise<void>}
	 */
	async start(settings, cheats) {
		await this.settings(settings);
		await this.#interop.start();
		// await this.cheats(cheats);

		const pixel_format = await this.#interop.pixel_format();
		const sample_rate = await this.#interop.sample_rate();

		this.#graphics.init(pixel_format);

		this.#stop = false;
		this.#running = new Promise((resolve) => {
			const step = async () => {
				await this.#interop.run(this.#speed);

				const video = Video.parse(Core.#memory, this.#data.video);
				const audio = Audio.parse(Core.#memory, this.#data.audio);

				if (video.data)
					this.#graphics.draw(video.data, video.width, video.height, video.pitch, video.ratio);

				if (this.#audio) {
					const audio_view = new Float32Array(Core.#memory.buffer, audio.data, audio.frames * 2);
					AudioPlayer.queue(audio_view, sample_rate * this.#speed, 2);
				}

				this.#stop ? resolve() : requestAnimationFrame(step);
			}

			requestAnimationFrame(step);
		});
	}

	/**
	 * @returns {Promise<void>}
	 */
	async stop() {
		this.#stop = true;
		await this.#running;

		await this.#interop.stop();
		this.#threads.forEach(child => child.close());
		this.#parallel.close();

		new Uint8Array(Core.#memory.buffer).fill(0);
	}

	/** @param {Settings} settings @returns {Promise<void>} */
	async settings(settings) { if (this.#interop) await this.#interop.settings(settings); }

	/** @param {Cheat[]} cheats @returns {Promise<void>} */
	async cheats(cheats) { if (this.#interop) await this.#interop.cheats(cheats); }

	/** @param {number} device @param {number} id @param {number} value @returns {Promise<void>} */
	async send(device, id, value) { if (this.#interop) await this.#interop.send(device, id, value); }

	/** @returns {Promise<void>} */
	async save() { if (this.#interop) await this.#interop.save(); }

	/** @returns {Promise<void>} */
	async restore() { if (this.#interop) await this.#interop.restore(); }

	/** @param {number} value @returns {void} */
	speed(value) { this.#speed = value; }

	/** @param {boolean} enable @returns {void} */
	audio(enable) { this.#audio = enable; }

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
