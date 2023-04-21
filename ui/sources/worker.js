/// <reference lib="webworker" />

import { File, OpenFile, WASI } from '@bjorn3/browser_wasi_shim';
import Caller from './services/caller';

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

	/** @type {WASI} */
	#wasi = null;

	#std = {
		/** @type {File} */
		in: new File([]),

		/** @type {File} */
		out: new File([]),

		/** @type {File} */
		err: new File([]),
	}

	/**
	 * @param {string} name
	 */
	constructor(name) {
		this.#id = Number(name.split('-')[1] ?? 0);
		this.#name = name.split('-')[0];
		this.#wasi = new WASI([], [], [
			new OpenFile(this.#std.in),
			new OpenFile(this.#std.out),
			new OpenFile(this.#std.err),
		]);
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
			const result = this.#instance.exports[`JUN_Core${name}`](...parameters);
			parameters.forEach((parameter, i) => this.#free(parameter, types[i]));

			return this.#deserialize(result, type);
		}
	};

	/**
	 * @param {WebAssembly.Memory} memory
	 * @param {number} start_arg
	 * @returns {Promise<void>}
	 */
	async init(memory, start_arg) {
		const origin = location.origin + location.pathname.substring(0, location.pathname.lastIndexOf('/'));
		const source = await WebAssembly.instantiateStreaming(fetch(`${origin}/modules/lib${this.#name}.wasm`), {
			env: { memory },
			wasi_snapshot_preview1: this.#wasi.wasiImport,
			wasi: { 'thread-spawn': (start_arg) => {
				return Caller.callSync(self, 'spawn', start_arg);
			}},
		});

		this.#instance = source.instance;

		if (start_arg) {
			this.#wasi.inst = source.instance;
			this.#instance.exports.wasi_thread_start(this.#id, start_arg);
			return;
		}

		this.#wasi.initialize(source.instance);

		this.#wrap('Create',             null,     ['string', 'string']);
		this.#wrap('GetFileBuffer',      'number', ['string', 'number']),
		this.#wrap('CountFiles',         'number', []),
		this.#wrap('IsFileUpdated',      'number', ['number']),
		this.#wrap('GetFilePath',        'string', ['number']),
		this.#wrap('GetFileLength',      'number', ['number']),
		this.#wrap('ReadFile',           'number', ['number']),
		this.#wrap('ResetCheats',        null,     []);
		this.#wrap('SetCheat',           null,     ['number', 'number', 'string']);
		this.#wrap('StartGame',          'number', []);
		this.#wrap('GetSampleRate',      'number', []);
		this.#wrap('GetVariableCount',   'number', []);
		this.#wrap('GetVariableKey',     'string', ['number']);
		this.#wrap('GetVariableName',    'string', ['number']);
		this.#wrap('GetVariableOptions', 'string', ['number']);
		this.#wrap('SetVariable',        null,     ['string', 'string']);
		this.#wrap('SetInput',           null,     ['number', 'number', 'number']);
		this.#wrap('Run',                null,     ['number']);
		this.#wrap('GetFrameData',       'number', []);
		this.#wrap('GetFrameWidth',      'number', []);
		this.#wrap('GetFrameHeight',     'number', []);
		this.#wrap('GetAudioData',       'number', []);
		this.#wrap('GetAudioFrames',     'number', []);
		this.#wrap('SaveState',          null,     []);
		this.#wrap('RestoreState',       null,     []);
		this.#wrap('Destroy',            null,     []);
	}

	print() {
		if (!this.#std.out.size)
			return;

		Core.#decoder.decode(this.#std.out.data)
			.split('\n')
			.map(line => line.trim().replaceAll('\x00', ''))
			.filter(line => !!line)
			.forEach(line => console.log(line));

		this.#std.out.truncate();
	}
}

const core = new Core(worker.name);
Caller.receive(self, core, () => core.print());
