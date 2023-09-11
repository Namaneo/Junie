import { Cheat } from '../entities/cheat';
import { Variable } from '../entities/variable';
import { Video } from '../entities/video';
import { Audio } from '../entities/audio';
import Parallel from './parallel';
import Filesystem from './filesystem';
import Core from './core';
import WASI from './wasi';
import Input from './input';

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

	/** @type {Input} */
	#input = new Input();

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
	 * @param {CorePort} core_port
	 * @param {MessagePort} fs_port
	 * @param {InteropConfig} config
	 * @returns {Promise<void>}
	 */
	async init(core_port, fs_port, config) {
		const core_parallel = new Parallel(Core, true);
		this.#core = core_parallel.link(core_port);

		const fs_parallel = new Parallel(Filesystem, true);
		const filesystem = fs_parallel.link(fs_port);
		this.#wasi = new WASI(config.memory, filesystem, config.fds);

		const junie_interop_video = (video_c) => {
			const video = Video.parse(config.memory, video_c);
			if (video.data)
				this.#core.draw(video);
		};

		const junie_interop_audio = (audio_c) => {
			const audio = Audio.parse(config.memory, audio_c);
			if (audio.frames)
				this.#core.play(audio);
		};

		const junie_interop_variables = (variables_c) => {
			this.#core.variables(Variable.parse(this.#instance, variables_c));
		}

		const source = await WebAssembly.instantiateStreaming(fetch(`${config.origin}/modules/${config.core}.wasm`), {
			env: { memory: config.memory, junie_interop_video, junie_interop_audio, junie_interop_variables },
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

		this.#wrap('SetAudio',           null,      ['boolean']);
		this.#wrap('SetSpeed',           null,      ['number']);
		this.#wrap('SetInput',           null,      ['number', 'number', 'number']);
		this.#wrap('SetVariables',       null,      ['number']);
		this.#wrap('SetCheats',          null,      ['number']);

		this.#wrap('SaveState',          null,      []);
		this.#wrap('RestoreState',       null,      []);

		this.Create(config.system, config.rom);
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

	/**
	 * @param {Button[]} buttons
	 * @param {Touch[]} touches
	 * @param {boolean} gamepad
	 * @param {DOMRect} canvas
	 * @param {number} width
	 * @param {number} height
	 * @returns {Promise<void>}
	 */
	input(buttons, touches, gamepad, canvas, width, height) {
		const messages = this.#input.process(buttons, touches, gamepad, canvas, width, height);
		for (const message of messages)
			this.SetInput(message.device, message.id, message.value);
	}

	/** @returns {Promise<void>} */
	start() { this.StartGame(); }

	/** @returns {Promise<void>} */
	stop() { this.Destroy(); }

	/** @param {boolean} enable @returns {Promise<void>} */
	audio(enable) { this.SetAudio(enable); }

	/** @param {number} value @returns {Promise<void>} */
	speed(value) { this.SetSpeed(value); }

	/** @returns {Promise<void>} */
	save() { this.SaveState(); }

	/** @returns {Promise<void>} */
	restore() { this.RestoreState(); }
}
