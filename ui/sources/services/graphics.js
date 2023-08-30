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

export default class Graphics {
	/** @type {WebAssembly.Memory} */
	#memory = null;

	/** @type {WebGL2RenderingContext} */
	#gl = null;

	/** @type {number} */
	#type = 0;

	/** @type {number} */
	#format = 0;

	/** @type {number} */
	#bpp = 0;

	/** @type {WebGLProgram} */
	#program = null;

	/** @type {WebGLTexture} */
	#texture = null;

	/** @type {WebGLBuffer} */
	#position_buffer = null;

	/** @type {number} */
	#position_location = 0;

	/** co@type {number} */
	#matrix_location = 0;

	/**
	 * @param {WebAssembly.Memory} memory
	 * @param {HTMLCanvasElement | OffscreenCanvas} canvas
	 */
	constructor(memory, canvas) {
		this.#memory = memory;
		this.#gl = canvas.getContext('webgl2');
	}

	/**
	 * @param {number} format
	 * @returns {Promise<void>}
	 */
	init(format) {
		switch (format) {
			default:
			case 0:
				this.#type = this.#gl.UNSIGNED_SHORT_5_5_5_1;
				this.#format = this.#gl.RGBA;
				this.#bpp = 2;
				break;
			case 1:
				this.#type = this.#gl.UNSIGNED_BYTE;
				this.#format = this.#gl.RGBA;
				this.#bpp = 4;
				break;
			case 2:
				this.#type = this.#gl.UNSIGNED_SHORT_5_6_5;
				this.#format = this.#gl.RGB;
				this.#bpp = 2;
				break;
		}

		const vertex_shader = this.#gl.createShader(this.#gl.VERTEX_SHADER);
		this.#gl.shaderSource(vertex_shader, vs());
		this.#gl.compileShader(vertex_shader);

		const fragment_shader = this.#gl.createShader(this.#gl.FRAGMENT_SHADER);
		this.#gl.shaderSource(fragment_shader, fs(this.#type != this.#gl.UNSIGNED_SHORT_5_6_5));
		this.#gl.compileShader(fragment_shader);

		this.#program = this.#gl.createProgram();
		this.#gl.attachShader(this.#program, vertex_shader);
		this.#gl.attachShader(this.#program, fragment_shader);
		this.#gl.linkProgram(this.#program);

		this.#texture = this.#gl.createTexture();
		this.#gl.bindTexture(this.#gl.TEXTURE_2D, this.#texture);
		this.#gl.texImage2D(this.#gl.TEXTURE_2D, 0, this.#format, 0, 0, 0, this.#format, this.#type, null);

		this.#position_location = this.#gl.getAttribLocation(this.#program, "a_position");
		this.#matrix_location = this.#gl.getUniformLocation(this.#program, "u_matrix");

		this.#position_buffer = this.#gl.createBuffer();
		this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, this.#position_buffer);
		this.#gl.bufferData(this.#gl.ARRAY_BUFFER, new Float32Array([ 0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1 ]), this.#gl.STATIC_DRAW);
	}

	/**
	 * @param {number} frame
	 * @param {number} width
	 * @param {number} height
	 * @param {number} pitch
	 */
	draw(frame, width, height, pitch, ratio) {
		this.#gl.canvas.width = width;
		this.#gl.canvas.height = width / ratio;

		this.#gl.viewport(0, 0, width, width / ratio);
		this.#gl.useProgram(this.#program);

		this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, this.#position_buffer);
		this.#gl.enableVertexAttribArray(this.#position_location);
		this.#gl.vertexAttribPointer(this.#position_location, 2, this.#gl.FLOAT, false, 0, 0);

		const frame_view = this.#type == this.#gl.UNSIGNED_BYTE
			? new Uint8Array(this.#memory.buffer, frame, (pitch / this.#bpp) * height * 4)
			: new Uint16Array(this.#memory.buffer, frame, (pitch / this.#bpp) * height);
		this.#gl.bindTexture(this.#gl.TEXTURE_2D, this.#texture);
		this.#gl.pixelStorei(this.#gl.UNPACK_ROW_LENGTH, pitch / this.#bpp);
		this.#gl.texImage2D(this.#gl.TEXTURE_2D, 0, this.#format, width, height, 0, this.#format, this.#type, frame_view);
		this.#gl.generateMipmap(this.#gl.TEXTURE_2D);

		this.#gl.uniformMatrix3fv(this.#matrix_location, false, [ 2, 0, 0, 0, -2, 0, -1, 1, 1 ]);
		this.#gl.drawArrays(this.#gl.TRIANGLES, 0, 6);
	}
}
