import { Cheat } from '../entities/cheat';
import { Settings } from '../entities/settings';
import { Variable } from '../entities/variable';
import { Video } from '../entities/video';
import { Audio } from '../entities/audio';
import Files from './files';
import Parallel from './parallel';
import AudioPlayer from './audio';
import Interop from './interop';
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

	/** @type {Promise} */
	static #running = Promise.resolve();

	/** @type {() => void} */
	static #stop = () => {};

	/** @type {Parallel<Interop>} */
	#parallel = null;

	/** @type {Interop} */
	#interop = null;

	/** @type {string} */
	#name = null;

	/** @type {Parallel[]} */
	#threads = [];

	/** @type {Graphics} */
	#graphics = null;

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
	 * @param {(variables: Variable[]) => void} on_variables
	 * @returns {Promise<void>}
	 */
	async create(system, rom, canvas, on_variables) {
		await Core.#running;
		Core.#running = new Promise(resolve => Core.#stop = resolve);

		this.#graphics = new Graphics(canvas);

		const origin = location.origin + location.pathname.substring(0, location.pathname.lastIndexOf('/'));
		const config = { core: this.#name, system, rom, origin, memory: Core.#memory };
		const script = await (await fetch('worker.js')).text();

		const handler = async message => {
			switch (message.data.type) {
				case 'thread':
					const thread = new Parallel(Interop, false, handler);
					const core = await thread.create(this.#name, script);
					await core.init(Parallel.instrument(this), await Files.clone(), { ...config, ...message.data });
					this.#threads.push(thread);
					break;
				case 'variables':
					on_variables(message.data.variables);
					break;
			}
		}

		this.#parallel = new Parallel(Interop, false, handler);
		this.#interop = await this.#parallel.create(this.#name, script);
		await this.#interop.init(Parallel.instrument(this), await Files.clone(), config);
	}

	/**
	 * @param {Settings} settings
	 * @param {Cheat[]} cheats
	 * @returns {Promise<void>}
	 */
	async start(settings, cheats) {
		await this.settings(settings);
		await this.#interop.start();
		await this.cheats(cheats);
	}

	/**
	 * @returns {Promise<void>}
	 */
	async stop() {
		try {
			await this.#interop?.stop();
		} catch (e) {
			console.error(e);
		}

		this.#threads.forEach(child => child.close());
		this.#threads = [];

		this.#parallel?.close();
		this.#parallel = null;

		this.#interop = null;

		new Uint8Array(Core.#memory.buffer).fill(0);

		Core.#stop();
	}

	/**
	 * @param {Video} video
	 * @returns {void}
	 */
	draw(video) {
		const video_view = video.format == 1
			? new Uint8Array(Core.#memory.buffer, video.data, video.pitch * video.height)
			: new Uint16Array(Core.#memory.buffer, video.data, (video.pitch * video.height) / 2);
		this.#graphics.draw(video_view, video);
	}

	/**
	 * @param {Audio} audio
	 * @returns
	 */
	play(audio) {
		const audio_view = new Float32Array(Core.#memory.buffer, audio.data, audio.frames * 2);
		AudioPlayer.queue(audio_view.slice(), audio.rate);
	}

	/** @param {Settings} settings @returns {Promise<void>} */
	async settings(settings) { await this.#interop?.variables(settings.variables); }

	/** @param {Cheat[]} cheats @returns {Promise<void>} */
	async cheats(cheats) { await this.#interop?.cheats(cheats); }

	/** @param {boolean} enable @returns {void} */
	async audio(enable) { await this.#interop?.audio(enable); }

	/** @param {number} value @returns {Promise<void>} */
	async speed(value) { await this.#interop?.speed(value); }

	/** @param {number} device @param {number} id @param {number} value @returns {Promise<void>} */
	async send(device, id, value) { await this.#interop?.send(device, id, value); }

	/** @returns {Promise<void>} */
	async save() { await this.#interop?.save(); }

	/** @returns {Promise<void>} */
	async restore() { await this.#interop?.restore(); }

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
