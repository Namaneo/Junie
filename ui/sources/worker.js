/// <reference lib="webworker" />

import WASI from './services/wasi';
import Caller from './services/caller';
import Parallel from './services/parallel';
import Filesystem from './services/filesystem';

/** @type {WorkerGlobalScope} */
const worker = self;

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

	/** @type {Worker[]} */
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

		let length = 0;
		let view = new Uint8Array(this.#instance.exports.memory.buffer, parameter);
		for (length; view[length] != 0; length++);
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
			const result = this.#instance.exports[name](...parameters);
			parameters.forEach((parameter, i) => this.#free(parameter, types[i]));

			return this.#deserialize(result, type);
		}
	};

	/**
	 * @param {WebAssembly.Memory} memory
	 * @param {MessagePort} port
	 * @param {number} start_arg
	 * @returns {Promise<void>}
	 */
	async init(memory, port, start_arg) {
		const parallel = new Parallel(Filesystem, true);
		this.#wasi = new WASI(memory, await parallel.link(port));

		const origin = location.origin + location.pathname.substring(0, location.pathname.lastIndexOf('/'));
		const source = await WebAssembly.instantiateStreaming(fetch(`${origin}/modules/lib${this.#name}.wasm`), {
			env: { memory },
			wasi_snapshot_preview1: this.#wasi.environment,
			wasi: { 'thread-spawn': (start_arg) => {
				const id = this.#threads.length + 1;
				const name = `${this.#name}-${id}`;
				const worker = new Worker('worker.js', { name, type: 'module' });

				Caller.call(worker, 'init', memory, parallel.open(), start_arg);

				this.#threads.push(worker);

				return id;
			}},
		});

		this.#instance = source.instance;

		if (start_arg) {
			this.#instance.exports.wasi_thread_start(this.#id, start_arg);
			return;
		}

		this.#instance.exports._initialize();

		this.#wrap('JUN_CoreCreate',             null,     ['string', 'string']);
		this.#wrap('JUN_CoreResetCheats',        null,     []);
		this.#wrap('JUN_CoreSetCheat',           null,     ['number', 'number', 'string']);
		this.#wrap('JUN_CoreStartGame',          'number', []);
		this.#wrap('JUN_CoreGetSampleRate',      'number', []);
		this.#wrap('JUN_CoreGetVariableCount',   'number', []);
		this.#wrap('JUN_CoreGetVariableKey',     'string', ['number']);
		this.#wrap('JUN_CoreGetVariableName',    'string', ['number']);
		this.#wrap('JUN_CoreGetVariableOptions', 'string', ['number']);
		this.#wrap('JUN_CoreSetVariable',        null,     ['string', 'string']);
		this.#wrap('JUN_CoreSetInput',           null,     ['number', 'number', 'number']);
		this.#wrap('JUN_CoreRun',                null,     ['number']);
		this.#wrap('JUN_CoreGetFrameData',       'number', []);
		this.#wrap('JUN_CoreGetFrameWidth',      'number', []);
		this.#wrap('JUN_CoreGetFrameHeight',     'number', []);
		this.#wrap('JUN_CoreGetAudioData',       'number', []);
		this.#wrap('JUN_CoreGetAudioFrames',     'number', []);
		this.#wrap('JUN_CoreSaveState',          null,     []);
		this.#wrap('JUN_CoreRestoreState',       null,     []);
		this.#wrap('JUN_CoreDestroy',            null,     []);
	}
}

const core = new Core(worker.name);
Caller.receive(self, core);
