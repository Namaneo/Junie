import { Cheat } from '../entities/cheat';
import { Settings } from '../entities/settings';
import { Variable } from '../entities/variable';
import Audio from './audio';
import Caller from './caller';
import Database from './database'
import Path from './path';

const vs = `
	attribute vec2 a_position;

	uniform vec2 u_resolution;
	uniform mat3 u_matrix;

	varying vec2 v_texCoord;

	void main() {
		gl_Position = vec4(u_matrix * vec3(a_position, 1), 1);
		v_texCoord = a_position;
	}
`;
const fs = `
	precision mediump float;

	uniform sampler2D u_image;

	varying vec2 v_texCoord;

	void main() {
		gl_FragColor = texture2D(u_image, v_texCoord);
	}
`;

class Interop {
	/** @type {string} */
	static #name = null;

	/** @type {WebAssembly.Memory} */
	static #memory = null;

	/** @type {Worker} */
	static #worker = null;

	/** @type {Worker[]} */
	static #threads = [];

	/** @type {Worker} */
	static get worker() { return this.#worker; }

	/**
	 * @param {string} name
	 * @param {WebAssembly.Memory} memory
	 * @returns {Promise<void>}
	 */
	static async init(name, memory) {
		this.#name = name;
		this.#memory = memory;
		this.#worker = new Worker('worker.js', { name, type: 'module' });

		Caller.receive(Interop.worker, Interop);
		await Caller.call(Interop.worker, 'init', memory);
	}

	/**
	 * @param {number} start_arg
	 * @param {Int32Array} sync
	 * @returns {number}
	 */
	static async spawn(start_arg) {
		const id = this.#threads.length + 1;

		const name = `${this.#name}-${id}`;
		const worker = new Worker('worker.js', { name, type: 'module' });

		Caller.receive(worker, Interop);
		Caller.call(worker, 'init', this.#memory, start_arg);

		this.#threads.push(worker);

		return id;
	}

	/**
	 * @returns {Promise<void>}
	 */
	static async terminate() {
		await Interop.Core.Destroy();

		this.#worker.terminate();
		this.#worker = null;

		this.#threads.forEach(thread => thread.terminate());
		this.#threads = [];
	}

	static Core = class {
		/** @param {string} system @param {string} rom @returns {Promise<void>} */
		static Create(system, rom) { return Caller.call(Interop.worker, 'JUN_CoreCreate', system, rom); }

		/** @returns {Promise<void>} */
		static ResetCheats() { return Caller.call(Interop.worker, 'JUN_CoreResetCheats'); }

		/** @param {number} index @param {number} enabled @param {string} code @returns {Promise<void>} */
		static SetCheat(index, enabled, code) { return Caller.call(Interop.worker, 'JUN_CoreSetCheat', index, enabled, code); }

		/** @returns {Promise<number>} */
		static StartGame() { return Caller.call(Interop.worker, 'JUN_CoreStartGame'); }

		/** @returns {Promise<number>} */
		static GetSampleRate() { return Caller.call(Interop.worker, 'JUN_CoreGetSampleRate'); }

		/** @returns {Promise<number>} */
		static GetVariableCount() { return Caller.call(Interop.worker, 'JUN_CoreGetVariableCount'); }

		/** @param {number} index @returns {Promise<string>} */
		static GetVariableKey(index) { return Caller.call(Interop.worker, 'JUN_CoreGetVariableKey', index); }

		/** @param {number} index @returns {Promise<string>} */
		static GetVariableName(index) { return Caller.call(Interop.worker, 'JUN_CoreGetVariableName', index); }

		/** @param {number} index @returns {Promise<string>} */
		static GetVariableOptions(index) { return Caller.call(Interop.worker, 'JUN_CoreGetVariableOptions', index); }

		/** @param {string} key @param {string} value @returns {Promise<void>} */
		static SetVariable(key, value) { return Caller.call(Interop.worker, 'JUN_CoreSetVariable', key, value); }

		/** @param {number} device @param {number} id @param {number} value @returns {Promise<void>} */
		static SetInput(device, id, value) { return Caller.call(Interop.worker, 'JUN_CoreSetInput', device, id, value); }

		/** @param {number} fast_forward @returns {Promise<void>} */
		static Run(fast_forward) { return Caller.call(Interop.worker, 'JUN_CoreRun', fast_forward); }

		/** @returns {Promise<number>} */
		static GetFrameData() { return Caller.call(Interop.worker, 'JUN_CoreGetFrameData'); }

		/** @returns {Promise<number>} */
		static GetFrameWidth() { return Caller.call(Interop.worker, 'JUN_CoreGetFrameWidth'); }

		/** @returns {Promise<number>} */
		static GetFrameHeight() { return Caller.call(Interop.worker, 'JUN_CoreGetFrameHeight'); }

		/** @returns {Promise<number>} */
		static GetAudioData() { return Caller.call(Interop.worker, 'JUN_CoreGetAudioData'); }

		/** @returns {Promise<number>} */
		static GetAudioFrames() { return Caller.call(Interop.worker, 'JUN_CoreGetAudioFrames'); }

		/** @returns {Promise<void>} */
		static SaveState() { return Caller.call(Interop.worker, 'JUN_CoreSaveState'); }

		/** @returns {Promise<void>} */
		static RestoreState() { return Caller.call(Interop.worker, 'JUN_CoreRestoreState'); }

		/** @returns {Promise<void>} */
		static Destroy() { return Caller.call(Interop.worker, 'JUN_CoreDestroy'); }
	}

	static Filesystem = class {
		/** @param {string} path @param {number} length @returns {Promise<number>} */
		static GetFileBuffer(path, length) { return Caller.call(Interop.worker, 'JUN_FilesystemGetFileBuffer', path, length); }

		/** @returns {Promise<number>} */
		static CountFiles() { return Caller.call(Interop.worker, 'JUN_FilesystemCountFiles'); }

		/** @param {number} index @returns {Promise<number>} */
		static IsFileUpdated(index) { return Caller.call(Interop.worker, 'JUN_FilesystemIsFileUpdated', index); }

		/** @param {number} index @returns {Promise<string>} */
		static GetFilePath(index) { return Caller.call(Interop.worker, 'JUN_FilesystemGetFilePath', index); }

		/** @param {number} index @returns {Promise<number>} */
		static GetFileLength(index) { return Caller.call(Interop.worker, 'JUN_FilesystemGetFileLength', index); }

		/** @param {number} index @returns {Promise<number>} */
		static ReadFile(index) { return Caller.call(Interop.worker, 'JUN_FilesystemReadFile', index); }

		/** @param {number} index @returns {Promise<void>} */
		static SeenFile(index) { return Caller.call(Interop.worker, 'JUN_FilesystemSeenFile', index); }
	}
}

export default class Core {
	/** @type {number} */
	static #INITIAL_MEMORY = 450 * 1024 * 1024;

	/** @type {WebAssembly.Memory} */
	static #memory = new WebAssembly.Memory({
		initial: this.#INITIAL_MEMORY / 65536,
		maximum: this.#INITIAL_MEMORY / 65536,
		shared: true,
	});

	/** @type {{[name: string]: Core}} */
	static #cores = {};

	/** @type {string} */
	#name = null;

	/** @type {HTMLCanvasElement} */
	#canvas = null;

	#state = {
		/** @type {string} */
		rom: null,

		/** @type {number} */
		speed: 1,

		/** @type {boolean} */
		audio: true,

		/** @type {boolean} */
		stop: false,

		/** @type {Promise} */
		running: null,
	}

	#state_gl = {
		/** @type {WebGLProgram} */
		program: null,

		/** @type {WebGLTexture} */
		texture: null,

		/** @type {WebGLBuffer} */
		position_buffer: null,

		/** @type {number} */
		position_location: 0,

		/** @type {number} */
		matrix_location: 0,
	}

	/**
	 * @param {string} name
	 */
	constructor(name) {
		this.#name = name;
	}

	/**
	 * @param {HTMLCanvasElement} canvas
	 * @returns {Promise<void>}
	 */
	async init(canvas) {
		this.#canvas = canvas;

		await Interop.init(this.#name, Core.#memory);

		const state = this.#state_gl;
		const gl = this.#canvas.getContext('webgl2');

		const vertex_shader = gl.createShader(gl.VERTEX_SHADER);
		gl.shaderSource(vertex_shader, vs);
		gl.compileShader(vertex_shader);

		const fragment_shader = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(fragment_shader, fs);
		gl.compileShader(fragment_shader);

		state.program = gl.createProgram();
		gl.attachShader(state.program, vertex_shader);
		gl.attachShader(state.program, fragment_shader);
		gl.linkProgram(state.program);

		state.texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, state.texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

		state.position_location = gl.getAttribLocation(state.program, "a_position");
		state.matrix_location = gl.getUniformLocation(state.program, "u_matrix");

		state.position_buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, state.position_buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([ 0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1 ]), gl.STATIC_DRAW);
	}

	/**
	 * @param {string} path
	 * @returns {Promise<void>}
	 */
	async #read(path) {
		const file = await Database.file(path);
		const reader = file.stream().getReader();
		const pointer = await Interop.Filesystem.GetFileBuffer(path, file.size);
		const data = new Uint8Array(Core.#memory.buffer, pointer, file.size);

		let offset = 0;
		await reader.read().then(function process({ done, value }) {
			if (done)
				return;

			data.set(value, offset);
			offset += value.length;

			return reader.read().then(process);
		});
	}

	/**
	 * @param {string} system
	 * @param {string} rom
	 * @returns {Promise<void>}
	 */
	async prepare(system, rom) {
		const state = this.#state;

		state.rom = Path.game(system, rom);

		await Interop.Core.Create(system, rom);

		const game_path = Path.game(system, rom.replace(/\.[^/.]+$/, ''));
		for (const path of await Database.list(game_path))
			await this.#read(path);
	}

	/**
	 * @returns {Promise<void>}
	 */
	async #sync() {
		const state = this.#state;

		for (let i = 0; i < await Interop.Filesystem.CountFiles(); i++) {
			const path = await Interop.Filesystem.GetFilePath(i);
			if (path == state.rom || !await Interop.Filesystem.IsFileUpdated(i))
				continue;

			const data = await Interop.Filesystem.ReadFile(i);
			const length = await Interop.Filesystem.GetFileLength(i);

			const view = new Uint8Array(Core.#memory.buffer, data, length);
			await Database.write(path, new Uint8Array(view));

			await Interop.Filesystem.SeenFile(i);
		}
	}

	/**
	 * @param {number} frame
	 * @param {number} width
	 * @param {number} height
	 */
	#draw(frame, width, height) {
		const state = this.#state_gl;
		const gl = this.#canvas.getContext('webgl2');

		gl.canvas.width = width;
		gl.canvas.height = height;

		gl.viewport(0, 0, width, height);
		gl.useProgram(state.program);

		gl.bindBuffer(gl.ARRAY_BUFFER, state.position_buffer);
		gl.enableVertexAttribArray(state.position_location);
		gl.vertexAttribPointer(state.position_location, 2, gl.FLOAT, false, 0, 0);

		const frame_view = new Uint8Array(Core.#memory.buffer, frame, width * height * 4);
		gl.bindTexture(gl.TEXTURE_2D, state.texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, frame_view);
		gl.generateMipmap(gl.TEXTURE_2D);

		gl.uniformMatrix3fv(state.matrix_location, false, [ 2, 0, 0, 0, -2, 0, -1, 1, 1 ]);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}

	/**
	 * @param {Settings} settings
	 * @param {Cheat[]} cheats
	 * @returns {Promise<void>}
	 */
	async start(settings, cheats) {
		const state = this.#state;

		await this.settings(settings);
		await Interop.Core.StartGame();
		await this.cheats(cheats);

		state.stop = false;
		state.running = new Promise((resolve) => {
			const step = async () => {
				await Interop.Core.Run(state.speed);

				const frame = await Interop.Core.GetFrameData();
				const width = await Interop.Core.GetFrameWidth();
				const height = await Interop.Core.GetFrameHeight();

				if (width != 0 && height != 0)
					this.#draw(frame, width, height);

				const sample_rate = await Interop.Core.GetSampleRate();
				Audio.update(sample_rate * state.speed, 2);

				if (state.audio) {
					const audio = await Interop.Core.GetAudioData();
					const frames = await Interop.Core.GetAudioFrames();
					const audio_view = new Float32Array(Core.#memory.buffer, audio, frames * 2);
					Audio.queue(audio_view);
				}

				await this.#sync();

				state.stop ? resolve() : requestAnimationFrame(step);
			}

			requestAnimationFrame(step);
		});
	}

	/**
	 * @returns {Promise<void>}
	 */
	async stop() {
		const state = this.#state;

		state.stop = true;
		await state.running;

		await Interop.terminate();
		new Uint8Array(Core.#memory.buffer).fill(0);
	}

	/**
	 * @returns {Promise<Variable[]>}
	 */
	async variables() {
		const variables = [];

		for (let i = 0; i < await Interop.Core.GetVariableCount(); i++) {
			const key = await Interop.Core.GetVariableKey(i);
			const name = await Interop.Core.GetVariableName(i);
			const options = (await Interop.Core.GetVariableOptions(i)).split('|');

			variables.push({ key, name, options });
		}

		return variables;
	}

	/**
	 * @param {Settings} settings
	 * @returns {Promise<void>}
	 */
	async settings(settings) {
		for (const key in settings)
			await Interop.Core.SetVariable(key, settings[key]);
	}

	/**
	 * @param {Cheat[]} cheats
	 * @returns {Promise<void>}
	 */
	async cheats(cheats) {
		await Interop.Core.ResetCheats();
		const filtered = cheats?.filter(x => x.enabled).sort((x, y) => x.order - y.order);
		for (const cheat of filtered ?? [])
			await Interop.Core.SetCheat(cheat.order, true, cheat.value);
	}

	/**
	 * @param {number} device
	 * @param {number} id
	 * @param {number} value
	 * @returns {Promise<void>}
	 */
	async send(device, id, value) {
		await Interop.Core.SetInput(device, id, value);
	}

	/**
	 * @returns {Promise<void>}
	 */
	async save() {
		await Interop.Core.SaveState();
	}

	/**
	 * @returns {Promise<void>}
	 */
	async restore() {
		await Interop.Core.RestoreState();
	}

	/**
	 * @param {number} value
	 * @returns {void}
	 */
	speed(value) {
		this.#state.speed = value;
	}

	/**
	 * @param {boolean} enable
	 * @returns {void}
	 */
	audio(enable) {
		this.#state.audio = enable;
	}

	/**
	 * @param {string} name
	 * @returns {Core}
	 */
	static create(name) {
		if (!this.#cores[name])
			this.#cores[name] = new Core(name);
		return this.#cores[name];
	}

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
