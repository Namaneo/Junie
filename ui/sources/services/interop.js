import { Settings } from '../entities/settings';
import { Cheat } from '../entities/cheat';
import { Variable } from '../entities/variable';
import { Video } from '../entities/video';
import { Audio } from '../entities/audio';
import Parallel from './parallel';
import Filesystem from './filesystem';
import WASI from './wasi';

export default class Interop {
	/** @type {TextEncoder} */
	static #encoder = new TextEncoder();

	/** @type {TextDecoder} */
	static #decoder = new TextDecoder();

	/** @type {number} */
	#id = 0;

	/** @type {string} */
	#name = null;

	/** @type {WebAssembly.Instance} */
	#instance = null;

	/** @type {WASI} */
	#wasi = null;

	/** @type {boolean} */
	#audio = true;

	/** @type {Promise} */
	#running = null;

	/** @type {boolean} */
	#stop = false;

	/** @type {number} */
	#video = 0;

	/** @type {number} */
	#audio = 0;

	/**
	 * @param {string} name
	 */
	constructor(name) {
		this.#id = Number(name?.split('-')[1] ?? 0);
		this.#name = name?.split('-')[0];
	}

	/**
	 * @param {WebAssembly.Instance} instance
	 * @param {('number' | 'string' | 'boolean' | null)} type
	 * @param {(number | string | boolean)} parameter
	 * @returns {number}
	 */
	static serialize(instance, type, parameter) {
		if (type != 'string' || parameter == null)
			return parameter;

		const memory = instance.exports.memory;
		const pointer = instance.exports.calloc(parameter.length + 1, 1);
		const view = new Uint8Array(memory.buffer, pointer, parameter.length);
		view.set(this.#encoder.encode(parameter));

		return pointer;
	}

	/**
	 * @param {WebAssembly.Instance} instance
	 * @param {('number' | 'string' | 'boolean' | null)} type
	 * @param {number} parameter
	 * @returns {(number | string | boolean)}
	 */
	static deserialize(instance, type, parameter) {
		if (type != 'string' || parameter == null)
			return parameter;

		const memory = instance.exports.memory;
		let view = new Uint8Array(memory.buffer, parameter);
		let length = 0; for (; view[length] != 0; length++);
		view = new Uint8Array(memory.buffer, parameter, length);

		return this.#decoder.decode(new Uint8Array(view));
	}

	/**
	 * @param {WebAssembly.Instance} instance
	 * @param {('number' | 'string' | 'boolean' | null)} type
	 * @param {number} parameter
	 * @returns {void}
	 */
	static free(instance, type, parameter) {
		if (type != 'string' || parameter == null)
			return;

		instance.exports.free(parameter);
	}

	/**
	 * @param {string} name
	 * @param {('number' | 'string' | null)} type
	 * @param {('number' | 'string')[]} types
	 * @returns {void}
	 */
	#wrap(name, type, types) {
		this[name] = (...parameters) => {
			parameters = parameters.map((parameter, i) => Interop.serialize(this.#instance, types[i], parameter));
			const result = this.#instance.exports[`JUN_Core${name}`](...parameters);
			parameters.forEach((parameter, i) => Interop.free(this.#instance, types[i], parameter));

			return Interop.deserialize(this.#instance, type, result);
		}
	};

	/**
	 * @param {string} system
	 * @param {string} rom
	 * @param {WebAssembly.Memory} memory
	 * @param {MessagePort} port
	 * @param {{path: string, offset: number}[]} fds
	 * @param {string} origin
	 * @param {number} start_arg
	 * @returns {Promise<Variable[]>}
	 */
	async init(system, rom, memory, port, fds, origin, start_arg) {
		const parallel = new Parallel(Filesystem, true);
		const filesystem = parallel.link(port);
		this.#wasi = new WASI(memory, filesystem, fds);

		const source = await WebAssembly.instantiateStreaming(fetch(`${origin}/modules/${this.#name}.wasm`), {
			env: { memory },
			wasi_snapshot_preview1: this.#wasi.environment,
			wasi: { 'thread-spawn': (start_arg) => {
				const id = filesystem.id();
				postMessage({ type: 'thread', id, fds: this.#wasi.fds, start_arg });
				return id;
			}},
		});

		this.#instance = source.instance;

		if (start_arg) {
			this.#instance.exports.wasi_thread_start(this.#id, start_arg);
			close();
			return;
		}

		this.#instance.exports._initialize();

		this.#wrap('Create',             null,     ['string', 'string']);
		this.#wrap('StartGame',          'number', []);
		this.#wrap('Destroy',            null,     []);

		this.#wrap('Lock',               null,     []);
		this.#wrap('Unlock',             null,     []);

		this.#wrap('GetVideo',           'number', []);
		this.#wrap('GetAudio',           'number', []);
		this.#wrap('GetVariables',       'number', []);

		this.#wrap('SetSpeed',           null,     ['number']);
		this.#wrap('SetInput',           null,     ['number', 'number', 'number']);
		this.#wrap('SetVariables',       null,     ['number']);
		this.#wrap('SetCheats',          null,     ['number']);

		this.#wrap('SaveState',          null,     []);
		this.#wrap('RestoreState',       null,     []);

		this.Create(system, rom);

		this.#video = this.GetVideo();
		this.#audio = this.GetAudio();

		return Variable.parse(this.#instance, this.GetVariables());
	}

	/** @returns {Promise<void>} */
	start() {
		this.StartGame();

		const memory = this.#instance.exports.memory;

		this.#stop = false;
		this.#running = new Promise(resolve => {
			const step = async () => {
				this.#stop ? resolve() : requestAnimationFrame(step);

				this.Lock();

				const video = Video.parse(memory, this.#video);
				const audio = Audio.parse(memory, this.#audio);

				if (video.data) {
					const video_view = video.format == 1
						? new Uint8Array(memory.buffer, video.data, video.pitch * video.height).slice()
						: new Uint16Array(memory.buffer, video.data, (video.pitch * video.height) / 2).slice();
					postMessage({ type: 'video', view: video_view, video }, [video_view.buffer]);
				}

				if (audio.frames && this.#audio) {
					const audio_view = new Float32Array(memory.buffer, audio.data, audio.frames * 2).slice();
					postMessage({ type: 'audio', view: audio_view, sample_rate: audio.rate }, [audio_view.buffer]);
				}

				this.Unlock();
			}

			requestAnimationFrame(step);
		});
	}

	/** @returns {Promise<void>} */
	async stop() {
		this.#stop = true;
		await this.#running;

		this.Destroy();
	}

	/** @param {Variable[]} variables @returns {Promise<void>} */
	variables(variables) {
		const variables_ptr = Variable.serialize(this.#instance, variables)
		this.SetVariables(variables_ptr);
		Variable.free(this.#instance, variables_ptr);
	}

	/** @param {Cheat[]} cheats @returns {Promise<void>} */
	cheats(cheats) {
		const cheats_ptr = Cheat.serialize(this.#instance, cheats)
		this.SetCheats(cheats_ptr);
		Cheat.free(this.#instance, cheats_ptr);
	}

	/** @param {boolean} enable @returns {Promise<void>} */
	audio(enable) { this.#audio = enable; }

	/** @param {number} value @returns {Promise<void>} */
	speed(value) { this.SetSpeed(value); }

	/** @param {number} device @param {number} id @param {number} value @returns {Promise<void>} */
	send(device, id, value) { this.SetInput(device, id, value); }

	/** @returns {Promise<void>} */
	save() { this.SaveState(); }

	/** @returns {Promise<void>} */
	restore() { this.RestoreState(); }
}
