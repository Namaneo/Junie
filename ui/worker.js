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

class Core {
	/** @type {string} */
	#name = null;

	/** @type {Object} */
	#module = null;

	/** @type {WebAssembly.Memory} */
	#memory = null;

	/** @type {OffscreenCanvas} */
	#canvas = null;

	#state = {
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
	 * @param {string} name
	 * @param {string} type
	 * @param {string[]} parameters
	 */
	#wrap(name, type, parameters) {
		this[name] = this.#module.cwrap(`JUN_Core${name}`, type, parameters);;
	}

	#init_gl() {
		const state = this.#state;
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
	 * @param {WebAssembly.Memory} memory
	 * @param {OffscreenCanvas} canvas
	 */
	async init(memory, canvas) {
		this.#memory = memory;
		this.#canvas = canvas;

		const origin = location.origin + location.pathname.substring(0, location.pathname.lastIndexOf('/'));
		this.#module = await (await import(`${origin}/modules/lib${this.#name}.js`)).default({ wasmMemory: this.#memory });

		this.#wrap('Create',             null,     ['string', 'string']);
		this.#wrap('GetFileBuffer',      'number', ['string', 'number']),
		this.#wrap('CountFiles',         'number', []),
		this.#wrap('GetFilePath',        'string', ['number']),
		this.#wrap('GetFileLength',      'number', ['number']),
		this.#wrap('ReadFile',           'number', ['number']),
		this.#wrap('ResetCheats',         null,     []);
		this.#wrap('SetCheat',           null,     ['number', 'number', 'string']);
		this.#wrap('StartGame',          'number', []);
		this.#wrap('GetSampleRate',      'number', []);
		this.#wrap('GetVariableCount',   'number', []);
		this.#wrap('IsVariableLocked',   'number', ['number']);
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

		this.#init_gl();
	}

	/**
	 * @param {number} frame
	 * @param {number} width
	 * @param {number} height
	 */
	#drawImage(frame, width, height) {
		const state = this.#state;
		const gl = this.#canvas.getContext('webgl2');

		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
		gl.useProgram(state.program);

		gl.bindBuffer(gl.ARRAY_BUFFER, state.position_buffer);
		gl.enableVertexAttribArray(state.position_location);
		gl.vertexAttribPointer(state.position_location, 2, gl.FLOAT, false, 0, 0);

		// https://stackoverflow.com/questions/12250953/drawing-an-image-using-webgl
		// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

		const frame_view = new Uint8Array(this.#memory.buffer, frame, width * height * 4);
		gl.bindTexture(gl.TEXTURE_2D, state.texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, frame_view);
		gl.generateMipmap(gl.TEXTURE_2D);

		gl.uniformMatrix3fv(state.matrix_location, false, [ 2, 0, 0, 0, -2, 0, -1, 1, 1 ]);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}

	/**
	 * @param {OffscreenCanvas} canvas
	 */
	async run(speed) {
		this.Run(speed);

		const frame = this.GetFrameData();
		const width = this.GetFrameWidth();
		const height = this.GetFrameHeight();

		this.#canvas.width = width;
		this.#canvas.height = height;

		if (width == 0 || height == 0)
			return;

		this.#drawImage(frame, width, height);
	}
}

const core = new Core(self.name);
onmessage = async (event) => {
	const response = { id: event.data.id, result: null };

	if (core[event.data.name])
		response.result = core[event.data.name](...event.data.parameters);

	response.result = await Promise.resolve(response.result);
	self.postMessage(response);
};
