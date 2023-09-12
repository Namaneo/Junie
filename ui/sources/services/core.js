import { InputButton, InputTouch } from '../entities/input';
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
	/** @type {Promise} */
	static #running = Promise.resolve();

	/** @type {() => void} */
	static #stop = () => {};

	/** @type {WebAssembly.Memory} */
	#memory = null;

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

	/** @type {(variables: Variable[]) => void} */
	#on_variables = null;

	/**
	 * @param {string} name
	 * @param {WebAssembly.Memory} memory
	 */
	constructor(name, memory) {
		this.#name = name;
		this.#memory = memory;
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
		this.#on_variables = on_variables

		const origin = location.origin + location.pathname.substring(0, location.pathname.lastIndexOf('/'));
		const config = { core: this.#name, system, rom, origin, memory: this.#memory };
		const script = await (await fetch('worker.js')).text();

		const handler = async message => {
			const thread = new Parallel(Interop, false, handler);
			const core = await thread.create(this.#name, script);
			await core.init(Parallel.instrument(this), await Files.clone(), { ...config, ...message.data });
			this.#threads.push(thread);
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

		new Uint8Array(this.#memory.buffer).fill(0);

		Core.#stop();
	}

	/**
	 * @param {Video} video
	 * @returns {void}
	 */
	draw(video) {
		const video_view = video.format == 1
			? new Uint8Array(this.#memory.buffer, video.data, video.pitch * video.height)
			: new Uint16Array(this.#memory.buffer, video.data, (video.pitch * video.height) / 2);
		this.#graphics.draw(video_view, video);
	}

	/**
	 * @param {Audio} audio
	 * @returns {void}
	 */
	play(audio) {
		const audio_view = new Int16Array(this.#memory.buffer, audio.data, audio.frames * 2);
		AudioPlayer.queue(audio_view.slice(), audio.rate);
	}

	/**
	 * @param {Variable[]} variables
	 * @returns {void}
	 */
	variables(variables) {
		this.#on_variables(variables);
	}

	/** @param {Settings} settings @returns {Promise<void>} */
	async settings(settings) { await this.#interop?.variables(settings.variables); }

	/** @param {Cheat[]} cheats @returns {Promise<void>} */
	async cheats(cheats) { await this.#interop?.cheats(cheats); }

	/** @param {boolean} enable @returns {Promise<void>} */
	async audio(enable) { await this.#interop?.audio(enable); }

	/** @param {number} value @returns {Promise<void>} */
	async speed(value) { await this.#interop?.speed(value); }

	/** @param {InputTouch[]} touches @param {InputButton[]} buttons @returns {Promise<void>} */
	async press(touches, buttons) { await this.#interop?.press(touches, buttons); }

	/** @param {InputTouch} touch @param {DOMRect} rect @param {number} width @param {number} height @returns {Promise<void>} */
	async touch(touch, rect, width, height) { await this.#interop?.touch(touch, rect, width, height); }

	/** @returns {Promise<void>} */
	async save() { await this.#interop?.save(); }

	/** @returns {Promise<void>} */
	async restore() { await this.#interop?.restore(); }
}
