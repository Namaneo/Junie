import WASI from './wasi';
import Parallel from './parallel';
import Filesystem from './filesystem';
import { Settings } from '../entities/settings';
import { Cheat } from '../entities/cheat';
import { Native } from '../entities/native';
import WASI_GL from './wasi-gl';

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

	/** @type {WASI} */
	#wasi = null;

	/** @type {WASI_GL} */
	#wasi_gl = null;

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
	 * @param {string} origin
	 * @param {number} start_arg
	 * @returns {Promise<void>}
	 */
	async init(system, rom, memory, port, origin, start_arg) {
		const filesystem = new Parallel(Filesystem, true);
		this.#wasi = new WASI(memory, filesystem.link(port));
		this.#wasi_gl = new WASI_GL(null);

		const source = await WebAssembly.instantiateStreaming(fetch(`${origin}/modules/${this.#name}.wasm`), {
			env: { memory, ...this.#wasi_gl.environment },
			wasi_snapshot_preview1: { ...this.#wasi.environment },
			wasi: { 'thread-spawn': (start_arg) => {
				const id = ++this.#threads;
				const port = filesystem.open();
				postMessage({ id, start_arg, port }, [port]);
				return id;
			}},
		});

		this.#instance = source.instance;

		if (start_arg) {
			this.#instance.exports.wasi_thread_start(this.#id, start_arg);
			return;
		}

		this.#instance.exports._initialize();

		this.#wrap('Create',             null,     ['string', 'string']);
		this.#wrap('StartGame',          'number', []);
		this.#wrap('Run',                null,     ['number']);
		this.#wrap('SetInput',           null,     ['number', 'number', 'number']);
		this.#wrap('Destroy',            null,     []);

		this.#wrap('GetPixelFormat',     'number', []);
		this.#wrap('GetSampleRate',      'number', []);
		this.#wrap('GetVideo',           'number', []);
		this.#wrap('GetAudio',           'number', []);

		this.#wrap('GetVariables',       'number', []);
		this.#wrap('SetVariable',        null,     ['string', 'string']);

		this.#wrap('SaveState',          null,     []);
		this.#wrap('RestoreState',       null,     []);

		this.#wrap('ResetCheats',        null,     []);
		this.#wrap('SetCheat',           null,     ['number', 'number', 'string']);

		await this.#wasi.load(system, rom);

		this.Create(system, rom);
	}

	/** @param {Settings} settings @returns {Promise<void>} */
	settings(settings) {
		for (const key in settings)
			this.SetVariable(key, settings[key]);
	}

	/** @param {Cheat[]} cheats @returns {Promise<void>} */
	cheats(cheats) {
		this.ResetCheats();
		const filtered = cheats?.filter(x => x.enabled).sort((x, y) => x.order - y.order);
		for (const cheat of filtered ?? [])
			this.SetCheat(cheat.order, true, cheat.value);
	}

	/** @returns {Promise<void>} */
	start() { this.StartGame(); }

	/** @returns {Promise<number>} */
	pixel_format() { return this.GetPixelFormat(); }

	/** @returns {Promise<number>} */
	sample_rate() { return this.GetSampleRate(); }

	/** @returns {Promise<Native>} */
	data() { return new Native(this); }

	/** @param {number} speed @returns {Promise<void>} */
	run(speed) { this.Run(speed); }

	/** @returns {Promise<void>} */
	stop() { this.Destroy(); }

	/** @param {number} device @param {number} id @param {number} value @returns {Promise<void>} */
	send(device, id, value) { this.SetInput(device, id, value); }

	/** @returns {Promise<void>} */
	save() { this.SaveState(); }

	/** @returns {Promise<void>} */
	restore() { this.RestoreState(); }
}
