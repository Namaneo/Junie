import { Cheat } from '../entities/cheat';
import { Settings } from '../entities/settings';
import { Variable } from '../entities/variable';
import Path from './path';
import Files from './files';
import Audio from './audio';
import Parallel from './parallel';
import Interop from './interop';
import NativeData from './native';

const vs = () => `
	attribute vec2 a_position;

	uniform vec2 u_resolution;
	uniform mat3 u_matrix;

	varying vec2 v_texCoord;

	void main() {
		gl_Position = vec4(u_matrix * vec3(a_position, 1), 1);
		v_texCoord = a_position;
	}
`;
const fs = (invert) => `
	precision mediump float;

	uniform sampler2D u_image;

	varying vec2 v_texCoord;

	void main() {
		gl_FragColor = texture2D(u_image, v_texCoord);
		if (${invert}) gl_FragColor = gl_FragColor.bgra;
	}
`;

export default class Core {
	/** @type {number} */
	static #INITIAL_MEMORY = 100 * 1024 * 1024;

	/** @type {WebAssembly.Memory} */
	static #memory = new WebAssembly.Memory({
		initial: (this.#INITIAL_MEMORY * 2) / 65536,
		maximum: (this.#INITIAL_MEMORY * 6) / 65536,
		shared: true,
	});

	/** @type {Parallel<Interop>} */
	#parallel = null;

	/** @type {Interop} */
	#interop = null;

	/** @type {string} */
	#name = null;

	/** @type {HTMLCanvasElement} */
	#canvas = null;

	/** @type {NativeData} */
	#native = null;

	#state = {
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
		/** @type {number} */
		type: 0,

		/** @type {number} */
		format: 0,

		/** @type {number} */
		bpp: 0,

		/** @type {WebGLProgram} */
		program: null,

		/** @type {WebGLTexture} */
		texture: null,

		/** @type {WebGLBuffer} */
		position_buffer: null,

		/** @type {number} */
		position_location: 0,

		/** co@type {number} */
		matrix_location: 0,
	}

	get aspect_ratio() { return this.#native?.media.video.ratio ?? 1; }

	/**
	 * @param {string} name
	 */
	constructor(name) {
		this.#name = name;
	}

	/**
	 * @param {number} format
	 * @returns {Promise<void>}
	 */
	async #initCanvas(format) {
		const state = this.#state_gl;

		const gl = this.#canvas.getContext('webgl2');

		switch (format) {
			default:
			case 0:
				state.type = gl.UNSIGNED_SHORT_5_5_5_1;
				state.format = gl.RGBA;
				state.bpp = 2;
				break;
			case 1:
				state.type = gl.UNSIGNED_BYTE;
				state.format = gl.RGBA;
				state.bpp = 4;
				break;
			case 2:
				state.type = gl.UNSIGNED_SHORT_5_6_5;
				state.format = gl.RGB;
				state.bpp = 2;
				break;
		}

		const vertex_shader = gl.createShader(gl.VERTEX_SHADER);
		gl.shaderSource(vertex_shader, vs());
		gl.compileShader(vertex_shader);

		const fragment_shader = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(fragment_shader, fs(state.type != gl.UNSIGNED_SHORT_5_6_5));
		gl.compileShader(fragment_shader);

		state.program = gl.createProgram();
		gl.attachShader(state.program, vertex_shader);
		gl.attachShader(state.program, fragment_shader);
		gl.linkProgram(state.program);

		state.texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, state.texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, state.format, 0, 0, 0, state.format, state.type, null);

		state.position_location = gl.getAttribLocation(state.program, "a_position");
		state.matrix_location = gl.getUniformLocation(state.program, "u_matrix");

		state.position_buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, state.position_buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([ 0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1 ]), gl.STATIC_DRAW);
	}

	/**
	 * @param {number} frame
	 * @param {number} width
	 * @param {number} height
	 * @param {number} pitch
	 */
	#draw(frame, width, height, pitch) {
		const state = this.#state_gl;
		const gl = this.#canvas.getContext('webgl2');

		gl.canvas.width = width;
		gl.canvas.height = height;

		gl.viewport(0, 0, width, height);
		gl.useProgram(state.program);

		gl.bindBuffer(gl.ARRAY_BUFFER, state.position_buffer);
		gl.enableVertexAttribArray(state.position_location);
		gl.vertexAttribPointer(state.position_location, 2, gl.FLOAT, false, 0, 0);

		const frame_view = state.type == gl.UNSIGNED_BYTE
			? new Uint8Array(Core.#memory.buffer, frame, (pitch / state.bpp) * height * 4)
			: new Uint16Array(Core.#memory.buffer, frame, (pitch / state.bpp) * height);
		gl.bindTexture(gl.TEXTURE_2D, state.texture);
		gl.pixelStorei(gl.UNPACK_ROW_LENGTH, pitch / state.bpp);
		gl.texImage2D(gl.TEXTURE_2D, 0, state.format, width, height, 0, state.format, state.type, frame_view);
		gl.generateMipmap(gl.TEXTURE_2D);

		gl.uniformMatrix3fv(state.matrix_location, false, [ 2, 0, 0, 0, -2, 0, -1, 1, 1 ]);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}

	/**
	 * @param {string} system
	 * @param {string} rom
	 * @param {HTMLCanvasElement} canvas
	 */
	async create(system, rom, canvas) {
		this.#canvas = canvas;
		this.#parallel = new Parallel(Interop, false);

		const origin = location.origin + location.pathname.substring(0, location.pathname.lastIndexOf('/'));
		const script = await (await fetch('worker.js')).text();
		this.#interop = await this.#parallel.create(this.#name, script);

		await this.#interop.init(Core.#memory, system, rom, await Files.clone(), origin);
		await this.#interop.Create(system, rom);

		this.#native = new NativeData(Core.#memory,
			await this.#interop.GetVariables(),
			await this.#interop.GetMedia()
		);
	}

	/**
	 * @param {Settings} settings
	 * @param {Cheat[]} cheats
	 * @returns {Promise<void>}
	 */
	async start(settings, cheats) {
		const state = this.#state;

		await this.settings(settings);
		await this.#interop.StartGame();
		await this.cheats(cheats);

		const pixel_format = await this.#interop.GetPixelFormat();
		const sample_rate = await this.#interop.GetSampleRate();

		this.#initCanvas(pixel_format);

		state.stop = false;
		state.running = new Promise((resolve) => {
			const step = async () => {
				await this.#interop.Run(state.speed);

				const { video, audio } = this.#native.media;

				if (video.frame)
					this.#draw(video.frame, video.width, video.height, video.pitch);

				if (state.audio) {
					const audio_view = new Float32Array(Core.#memory.buffer, audio.data, audio.frames * 2);
					Audio.queue(audio_view, sample_rate * state.speed, 2);
				}

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

		await this.#interop.Destroy();
		this.#parallel.close();
		new Uint8Array(Core.#memory.buffer).fill(0);
	}

	/**
	 * @returns {Variable[]}
	 */
	variables() {
		return this.#native.variables();
	}

	/**
	 * @param {Settings} settings
	 * @returns {Promise<void>}
	 */
	async settings(settings) {
		for (const key in settings)
			await this.#interop.SetVariable(key, settings[key]);
	}

	/**
	 * @param {Cheat[]} cheats
	 * @returns {Promise<void>}
	 */
	async cheats(cheats) {
		await this.#interop.ResetCheats();
		const filtered = cheats?.filter(x => x.enabled).sort((x, y) => x.order - y.order);
		for (const cheat of filtered ?? [])
			await this.#interop.SetCheat(cheat.order, true, cheat.value);
	}

	/**
	 * @param {number} device
	 * @param {number} id
	 * @param {number} value
	 * @returns {Promise<void>}
	 */
	async send(device, id, value) {
		if (this.#interop)
			await this.#interop.SetInput(device, id, value);
	}

	/**
	 * @returns {Promise<void>}
	 */
	async save() {
		if (this.#interop)
			await this.#interop.SaveState();
	}

	/**
	 * @returns {Promise<void>}
	 */
	async restore() {
		if (this.#interop)
			await this.#interop.RestoreState();
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
