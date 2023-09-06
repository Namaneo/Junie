import { Video } from "../entities/video";

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

class GraphicsContext {
	/** @type {number} */
	type = 0;

	/** @type {number} */
	format = 0;

	/** @type {number} */
	bpp = 0;

	/** @type {WebGLProgram} */
	program = null;

	/** @type {WebGLTexture} */
	texture = null;

	/** @type {WebGLBuffer} */
	position_buffer = null;

	/** @type {number} */
	position_location = 0;

	/** co@type {number} */
	matrix_location = 0;

	/**
	 * @param {WebGL2RenderingContext} gl
	 * @param {number} type
	 * @param {number} format
	 * @param {number} bpp
	 */
	constructor(gl, type, format, bpp) {
		this.type = type;
		this.format = format;
		this.bpp = bpp;

		const vertex_shader = gl.createShader(gl.VERTEX_SHADER);
		gl.shaderSource(vertex_shader, vs());
		gl.compileShader(vertex_shader);

		const fragment_shader = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(fragment_shader, fs(this.type != gl.UNSIGNED_SHORT_5_6_5));
		gl.compileShader(fragment_shader);

		this.program = gl.createProgram();
		gl.attachShader(this.program, vertex_shader);
		gl.attachShader(this.program, fragment_shader);
		gl.linkProgram(this.program);

		this.texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, this.format, 0, 0, 0, this.format, this.type, null);

		this.position_location = gl.getAttribLocation(this.program, "a_position");
		this.matrix_location = gl.getUniformLocation(this.program, "u_matrix");

		this.position_buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([ 0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1 ]), gl.STATIC_DRAW);
	}
}

export default class Graphics {
	/** @type {WebGL2RenderingContext} */
	#gl = null;

	/** @type {GraphicsContext[]} */
	#contexts = [];

	/**
	 * @param {HTMLCanvasElement | OffscreenCanvas} canvas
	 */
	constructor(canvas) {
		this.#gl = canvas.getContext('webgl2');

		this.#contexts[0] = new GraphicsContext(this.#gl, this.#gl.UNSIGNED_SHORT_5_5_5_1, this.#gl.RGBA, 2);
		this.#contexts[1] = new GraphicsContext(this.#gl, this.#gl.UNSIGNED_BYTE,          this.#gl.RGBA, 4);
		this.#contexts[2] = new GraphicsContext(this.#gl, this.#gl.UNSIGNED_SHORT_5_6_5,   this.#gl.RGB,  2);
	}

	/**
	 * @param {ArrayBufferView} view
	 * @param {Video} video
	 */
	draw(view, video) {
		const context = this.#contexts[video.format];

		this.#gl.canvas.width = video.width;
		this.#gl.canvas.height = video.width / video.ratio;

		this.#gl.viewport(0, 0, video.width, video.width / video.ratio);
		this.#gl.useProgram(context.program);

		this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, context.position_buffer);
		this.#gl.enableVertexAttribArray(context.position_location);
		this.#gl.vertexAttribPointer(context.position_location, 2, this.#gl.FLOAT, false, 0, 0);

		this.#gl.bindTexture(this.#gl.TEXTURE_2D, context.texture);
		this.#gl.pixelStorei(this.#gl.UNPACK_ROW_LENGTH, video.pitch / context.bpp);
		this.#gl.texImage2D(this.#gl.TEXTURE_2D, 0, context.format, video.width, video.height, 0, context.format, context.type, view);
		this.#gl.generateMipmap(this.#gl.TEXTURE_2D);

		this.#gl.uniformMatrix3fv(context.matrix_location, false, [ 2, 0, 0, 0, -2, 0, -1, 1, 1 ]);
		this.#gl.drawArrays(this.#gl.TRIANGLES, 0, 6);
	}
}
