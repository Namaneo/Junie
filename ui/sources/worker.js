/// <reference lib="webworker" />

import WASI from './services/wasi';
import Parallel, { instrumentContext } from './services/parallel';
import Filesystem from './services/filesystem';
import Interop from './services/interop';
import Path from './services/path';

class Core {
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

	/** @type {Parallel[]} */
	#threads = [];

	/** @type {WASI} */
	#wasi = null;

	/**
	 * @param {string} name
	 */
	constructor(name) {
		this.#id = Number(name.split('-')[1] ?? 0);
		this.#name = name.split('-')[0];
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
		view.set(Core.#encoder.encode(parameter));

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

		return Core.#decoder.decode(new Uint8Array(view));
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
	 * @param {WebAssembly.Memory} memory
	 * @param {MessagePort} port
	 * @param {string} origin
	 * @param {number} start_arg
	 * @returns {Promise<void>}
	 */
	async init(memory, port, origin, start_arg) {
		const filesystem = new Parallel(Filesystem, true);
		this.#wasi = new WASI(memory, filesystem.link(port));
		if (!start_arg) await this.#wasi.load();

		const source = await WebAssembly.instantiateStreaming(fetch(`${origin}/modules/lib${this.#name}.wasm`), {
			env: { memory },
			wasi_snapshot_preview1: this.#wasi.environment,
			wasi: { 'thread-spawn': (start_arg) => {
				const child = new Parallel(Interop, false);
				const id = this.#threads.push(child);

				(async () => {
					const script = await (await fetch(`${origin}/worker.js`)).text();
					const core = await child.create(`${this.#name}-${id}`, script);
					await core.init(memory, filesystem.open(), origin, start_arg);
				})()

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
		this.#wrap('GetMedia',       	 'number', []);

		this.#wrap('GetVariables',       'number', []);
		this.#wrap('SetVariable',        null,     ['string', 'string']);

		this.#wrap('SaveState',          null,     []);
		this.#wrap('RestoreState',       null,     []);

		this.#wrap('ResetCheats',        null,     []);
		this.#wrap('SetCheat',           null,     ['number', 'number', 'string']);
	}
}

onmessage = instrumentContext(new Core(self.name));
