import { Settings } from '../entities/settings';
import { Cheat } from '../entities/cheat';
import { Native } from '../entities/native';
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

	/** @type {number} */
	#threads = 0;

	/** @type {Native} */
	#data = null;

	/** @type {WASI} */
	#wasi = null;

	/** @type {boolean} */
	#audio = true;

	/** @type {number} */
	#speed = 1;

	/** @type {Promise} */
	#running = null;

	/** @type {boolean} */
	#stop = false;

	/**
	 * @param {string} name
	 */
	constructor(name) {
		this.#id = Number(name?.split('-')[1] ?? 0);
		this.#name = name?.split('-')[0];
	}

	/**
	 * @param {(number | string)} parameter
	 * @param {('number' | 'string' | null)} type
	 * @returns {number}
	 */
	#serialize(parameter, type) {
		if (type == null || type == 'number')
			return parameter;

		const pointer = this.#instance.exports.calloc(parameter.length + 1, 1);
		const view = new Uint8Array(this.#instance.exports.memory.buffer, pointer, parameter.length);
		view.set(Interop.#encoder.encode(parameter));

		return pointer;
	}

	/**
	 * @param {number} parameter
	 * @param {('number' | 'string' | null)} type
	 * @returns {(number | string)}
	 */
	#deserialize(parameter, type) {
		if (type == null || type == 'number')
			return parameter;

		let view = new Uint8Array(this.#instance.exports.memory.buffer, parameter);
		let length = 0; for (; view[length] != 0; length++);
		view = new Uint8Array(this.#instance.exports.memory.buffer, parameter, length);

		return Interop.#decoder.decode(new Uint8Array(view));
	}

	/**
	 * @param {number} parameter
	 * @param {('number' | 'string' | null)} type
	 * @returns {void}
	 */
	#free(parameter, type) {
		if (type == null || type == 'number')
			return;

		this.#instance.exports.free(parameter);
	}

	/**
	 * @param {string} name
	 * @param {('number' | 'string' | null)} type
	 * @param {('number' | 'string')[]} types
	 * @returns {void}
	 */
	#wrap(name, type, types) {
		this[name] = (...parameters) => {
			parameters = parameters.map((parameter, i) => this.#serialize(parameter, types[i]));
			const result = this.#instance.exports[`JUN_Core${name}`](...parameters);
			parameters.forEach((parameter, i) => this.#free(parameter, types[i]));

			return this.#deserialize(result, type);
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
	 * @returns {Promise<void>}
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

		this.#wrap('GetPixelFormat',     'number', []);
		this.#wrap('GetSampleRate',      'number', []);
		this.#wrap('GetVideo',           'number', []);
		this.#wrap('GetAudio',           'number', []);

		this.#wrap('SetSpeed',           null,     ['number']);
		this.#wrap('SetInput',           null,     ['number', 'number', 'number']);

		this.#wrap('GetVariables',       'number', []);
		this.#wrap('SetVariable',        null,     ['string', 'string']);

		this.#wrap('SaveState',          null,     []);
		this.#wrap('RestoreState',       null,     []);

		this.#wrap('ResetCheats',        null,     []);
		this.#wrap('SetCheat',           null,     ['number', 'number', 'string']);

		this.Create(system, rom);

		this.#data = new Native(this);
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

				const pixel_format = this.GetPixelFormat();
				const sample_rate = this.GetSampleRate();

				const video = Video.parse(memory, this.#data.video);
				const audio = Audio.parse(memory, this.#data.audio);

				if (video.data) {
					const video_view = pixel_format == 1
						? new Uint8Array(memory.buffer, video.data, video.pitch * video.height).slice()
						: new Uint16Array(memory.buffer, video.data, (video.pitch * video.height) / 2).slice();
					postMessage({ type: 'video', view: video_view, video, pixel_format }, [video_view.buffer]);
				}

				if (audio.frames && this.#audio) {
					const audio_view = new Float32Array(memory.buffer, audio.data, audio.frames * 2).slice();
					postMessage({ type: 'audio', view: audio_view, sample_rate }, [audio_view.buffer]);
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

	/** @param {Settings} settings @returns {Promise<void>} */
	settings(settings) {
		this.Lock();
		for (const key in settings)
			this.SetVariable(key, settings[key]);
		this.Unlock();
	}

	/** @param {Cheat[]} cheats @returns {Promise<void>} */
	cheats(cheats) {
		this.Lock();
		this.ResetCheats();
		const filtered = cheats?.filter(x => x.enabled).sort((x, y) => x.order - y.order);
		for (const cheat of filtered ?? [])
			this.SetCheat(cheat.order, true, cheat.value);
		this.Unlock();
	}

	/** @returns {Promise<Variable[]>} */
	variables() { return Variable.parse(this.#instance.exports.memory, this.#data.variables); }

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
