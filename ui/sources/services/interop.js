import { Cheat } from '../entities/cheat';
import { Variable } from '../entities/variable';
import { Video } from '../entities/video';
import { Audio } from '../entities/audio';
import Parallel from './parallel';
import Filesystem from './filesystem';
import WASI from './wasi';
import Core from './core';

class InteropConfig {
	/** @type {string} */
	core = null;

	/** @type {string} */
	system = null;

	/** @type {string} */
	rom = null;

	/** @type {WebAssembly.Memory} */
	memory = null;

	/** @type {{path: string, offset: number}[]} */
	fds = null;

	/** @type {string} */
	origin = null;

	/** @type {number} */
	start_arg = null;
}

export default class Interop {
	/** @type {TextEncoder} */
	static #encoder = new TextEncoder();

	/** @type {TextDecoder} */
	static #decoder = new TextDecoder();

	/** @type {Core} */
	#core = null;

	/** @type {WASI} */
	#wasi = null;

	/** @type {WebAssembly.Instance} */
	#instance = null;

	/** @type {Promise} */
	#running = null;

	/** @type {boolean} */
	#stop = false;

	/** @type {number} */
	#video = 0;

	/** @type {number} */
	#audio = 0;

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
			const result = this.#instance.exports[`Junie${name}`](...parameters);
			parameters.forEach((parameter, i) => Interop.free(this.#instance, types[i], parameter));

			return Interop.deserialize(this.#instance, type, result);
		}
	};

	/**
	 * @param {MessagePort} core_port
	 * @param {MessagePort} fs_port
	 * @param {InteropConfig} config
	 * @returns {Promise<Variable[]>}
	 */
	async init(core_port, fs_port, config) {
		const core_parallel = new Parallel(Core, true);
		this.#core = core_parallel.link(core_port);

		const fs_parallel = new Parallel(Filesystem, true);
		const filesystem = fs_parallel.link(fs_port);
		this.#wasi = new WASI(config.memory, filesystem, config.fds);

		const source = await WebAssembly.instantiateStreaming(fetch(`${config.origin}/modules/${config.core}.wasm`), {
			env: { memory: config.memory },
			wasi_snapshot_preview1: this.#wasi.environment,
			wasi: { 'thread-spawn': (start_arg) => {
				const id = filesystem.id();
				postMessage({ id, fds: this.#wasi.fds, start_arg });
				return id;
			}},
		});

		this.#instance = source.instance;

		if (config.start_arg) {
			this.#instance.exports.wasi_thread_start(config.id, config.start_arg);
			close();
			return [];
		}

		this.#instance.exports._initialize();

		this.#wrap('Create',             null,      ['string', 'string']);
		this.#wrap('StartGame',          'boolean', []);
		this.#wrap('Destroy',            null,      []);

		this.#wrap('Lock',               null,      []);
		this.#wrap('Unlock',             null,      []);

		this.#wrap('GetVideo',           'number',  []);
		this.#wrap('GetAudio',           'number',  []);
		this.#wrap('GetVariables',       'number',  []);

		this.#wrap('SetAudio',           null,      ['boolean']);
		this.#wrap('SetSpeed',           null,      ['number']);
		this.#wrap('SetInput',           null,      ['number', 'number', 'number']);
		this.#wrap('SetVariables',       null,      ['number']);
		this.#wrap('SetCheats',          null,      ['number']);

		this.#wrap('SaveState',          null,      []);
		this.#wrap('RestoreState',       null,      []);

		this.Create(config.system, config.rom);

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
				this.#core.draw(Video.parse(memory, this.#video));
				this.#core.play(Audio.parse(memory, this.#audio));
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
	audio(enable) { this.SetAudio(enable); }

	/** @param {number} value @returns {Promise<void>} */
	speed(value) { this.SetSpeed(value); }

	/** @param {number} device @param {number} id @param {number} value @returns {Promise<void>} */
	send(device, id, value) { this.SetInput(device, id, value); }

	/** @returns {Promise<void>} */
	save() { this.SaveState(); }

	/** @returns {Promise<void>} */
	restore() { this.RestoreState(); }
}
