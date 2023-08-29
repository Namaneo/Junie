export default class WASI_GL {
	/** @type {WebGL2RenderingContext} */
	#gl = null;

	/**
	 * @param {HTMLCanvasElement | OffscreenCanvas} canvas
	 */
	constructor(canvas) {
		this.#gl = canvas?.getContext('webgl2');
	}

	get environment() {
		return {
			glActiveTexture: (texture) => {
				// this.#gl.activeTexture(texture);
			},
			glAttachShader: (program, shader) => {
				// this.#gl.attachShader(program, shader);
			},
			glBindAttribLocation: (program, index, name) => {
				// this.#gl.bindAttribLocation(program, index, name);
			},
			glBindBuffer: (target, buffer) => {
				// this.#gl.bindBuffer(target, buffer);
			},
			glBindFramebuffer: (target, framebuffer) => {
				// this.#gl.bindFramebuffer(target, framebuffer);
			},
			glBindRenderbuffer: (target, renderbuffer) => {
				// this.#gl.bindRenderbuffer(target, renderbuffer);
			},
			glBindTexture: (target, texture) => {
				// this.#gl.bindTexture(target, texture);
			},
			glBlendColor: (red, green, blue, alpha) => {
				// this.#gl.blendColor(red, green, blue, alpha);
			},
			glBlendEquation: (mode) => {
				// this.#gl.blendEquation(mode);
			},
			glBlendEquationSeparate: (modeRGB, modeAlpha) => {
				// this.#gl.blendEquationSeparate(modeRGB, modeAlpha);
			},
			glBlendFunc: (sfactor, dfactor) => {
				// this.#gl.blendFunc(sfactor, dfactor);
			},
			glBlendFuncSeparate: (sfactorRGB, dfactorRGB, sfactorAlpha, dfactorAlpha) => {
				// this.#gl.blendFuncSeparate(sfactorRGB, dfactorRGB, sfactorAlpha, dfactorAlpha);
			},
			glBufferData: (target, size, data, usage) => {
				// this.#gl.bufferData(target, size, data, usage);
			},
			glBufferSubData: (target, offset, size, data) => {
				// this.#gl.bufferSubData(target, offset, size, data);
			},
			glCheckFramebufferStatus: (target) => {
				// this.#gl.checkFramebufferStatus(target);
			},
			glClear: (mask) => {
				// this.#gl.clear(mask);
			},
			glClearColor: (red, green, blue, alpha) => {
				// this.#gl.clearColor(red, green, blue, alpha);
			},
			glClearDepthf: (d) => {
				// this.#gl.clearDepthf(d); // TODO
			},
			glClearStencil: (s) => {
				// this.#gl.clearStencil(s);
			},
			glColorMask: (red, green, blue, alpha) => {
				// this.#gl.colorMask(red, green, blue, alpha);
			},
			glCompileShader: (shader) => {
				// this.#gl.compileShader(shader);
			},
			glCompressedTexImage2D: (target, level, internalformat, width, height, border, imageSize, data) => {
				// this.#gl.compressedTexImage2D(target, level, internalformat, width, height, border, imageSize, data);
			},
			glCompressedTexSubImage2D: (target, level, xoffset, yoffset, width, height, format, imageSize, data) => {
				// this.#gl.compressedTexSubImage2D(target, level, xoffset, yoffset, width, height, format, imageSize, data);
			},
			glCopyTexImage2D: (target, level, internalformat, x, y, width, height, border) => {
				// this.#gl.copyTexImage2D(target, level, internalformat, x, y, width, height, border);
			},
			glCopyTexSubImage2D: (target, level, xoffset, yoffset, x, y, width, height) => {
				// this.#gl.copyTexSubImage2D(target, level, xoffset, yoffset, x, y, width, height);
			},
			glCreateProgram: () => {
				// this.#gl.createProgram();
			},
			glCreateShader: (type) => {
				// this.#gl.createShader(type);
			},
			glCullFace: (mode) => {
				// this.#gl.cullFace(mode);
			},
			glDeleteBuffers: (n, buffers) => {
				// this.#gl.deleteBuffers(n, buffers); // TODO
			},
			glDeleteFramebuffers: (n, framebuffers) => {
				// this.#gl.deleteFramebuffers(n, framebuffers); // TODO
			},
			glDeleteProgram: (program) => {
				// this.#gl.deleteProgram(program);
			},
			glDeleteRenderbuffers: (n, renderbuffers) => {
				// this.#gl.deleteRenderbuffers(n, renderbuffers); // TODO
			},
			glDeleteShader: (shader) => {
				// this.#gl.deleteShader(shader);
			},
			glDeleteTextures: (n, textures) => {
				// this.#gl.deleteTextures(n, textures); // TODO
			},
			glDepthFunc: (func) => {
				// this.#gl.depthFunc(func);
			},
			glDepthMask: (flag) => {
				// this.#gl.depthMask(flag);
			},
			glDepthRangef: (n, f) => {
				// this.#gl.depthRangef(n, f); // TODO
			},
			glDetachShader: (program, shader) => {
				// this.#gl.detachShader(program, shader);
			},
			glDisable: (cap) => {
				// this.#gl.disable(cap);
			},
			glDisableVertexAttribArray: (index) => {
				// this.#gl.disableVertexAttribArray(index);
			},
			glDrawArrays: (mode, first, count) => {
				// this.#gl.drawArrays(mode, first, count);
			},
			glDrawElements: (mode, count, type, indices) => {
				// this.#gl.drawElements(mode, count, type, indices);
			},
			glEnable: (cap) => {
				// this.#gl.enable(cap);
			},
			glEnableVertexAttribArray: (index) => {
				// this.#gl.enableVertexAttribArray(index);
			},
			glFinish: () => {
				// this.#gl.finish();
			},
			glFlush: () => {
				// this.#gl.flush();
			},
			glFramebufferRenderbuffer: (target, attachment, renderbuffertarget, renderbuffer) => {
				// this.#gl.framebufferRenderbuffer(target, attachment, renderbuffertarget, renderbuffer);
			},
			glFramebufferTexture2D: (target, attachment, textarget, texture, level) => {
				// this.#gl.framebufferTexture2D(target, attachment, textarget, texture, level);
			},
			glFrontFace: (mode) => {
				// this.#gl.frontFace(mode);
			},
			glGenBuffers: (n, buffers) => {
				// this.#gl.genBuffers(n, buffers); // TODO
			},
			glGenerateMipmap: (target) => {
				// this.#gl.generateMipmap(target);
			},
			glGenFramebuffers: (n, framebuffers) => {
				// this.#gl.genFramebuffers(n, framebuffers); // TODO
			},
			glGenRenderbuffers: (n, renderbuffers) => {
				// this.#gl.genRenderbuffers(n, renderbuffers); // TODO
			},
			glGenTextures: (n, textures) => {
				// this.#gl.genTextures(n, textures); // TODO
			},
			glGetActiveAttrib: (program, index, bufSize, length, size, type, name) => {
				// this.#gl.getActiveAttrib(program, index, bufSize, length, size, type, name);
			},
			glGetActiveUniform: (program, index, bufSize, length, size, type, name) => {
				// this.#gl.getActiveUniform(program, index, bufSize, length, size, type, name);
			},
			glGetAttachedShaders: (program, maxCount, count, shaders) => {
				// this.#gl.getAttachedShaders(program, maxCount, count, shaders);
			},
			glGetAttribLocation: (program, name) => {
				// this.#gl.getAttribLocation(program, name);
			},
			glGetBooleanv: (pname, data) => {
				// this.#gl.getBooleanv(pname, data); // TODO
			},
			glGetBufferParameteriv: (target, pname, params) => {
				// this.#gl.getBufferParameteriv(target, pname, params); // TODO
			},
			glGetError: () => {
				// this.#gl.getError();
			},
			glGetFloatv: (pname, data) => {
				// this.#gl.getFloatv(pname, data); // TODO
			},
			glGetFramebufferAttachmentParameteriv: (target, attachment, pname, params) => {
				// this.#gl.getFramebufferAttachmentParameteriv(target, attachment, pname, params); // TODO
			},
			glGetIntegerv: (pname, data) => {
				// this.#gl.getIntegerv(pname, data); // TODO
			},
			glGetProgramiv: (program, pname, params) => {
				// this.#gl.getProgramiv(program, pname, params); // TODO
			},
			glGetProgramInfoLog: (program, bufSize, length, infoLog) => {
				// this.#gl.getProgramInfoLog(program, bufSize, length, infoLog);
			},
			glGetRenderbufferParameteriv: (target, pname, params) => {
				// this.#gl.getRenderbufferParameteriv(target, pname, params); // TODO
			},
			glGetShaderiv: (shader, pname, params) => {
				// this.#gl.getShaderiv(shader, pname, params); // TODO
			},
			glGetShaderInfoLog: (shader, bufSize, length, infoLog) => {
				// this.#gl.getShaderInfoLog(shader, bufSize, length, infoLog);
			},
			glGetShaderPrecisionFormat: (shadertype, precisiontype, range, precision) => {
				// this.#gl.getShaderPrecisionFormat(shadertype, precisiontype, range, precision);
			},
			glGetShaderSource: (shader, bufSize, length, source) => {
				// this.#gl.getShaderSource(shader, bufSize, length, source);
			},
			glGetString: (name) => {
				// this.#gl.getString(name); // TODO
			},
			glGetTexParameterfv: (target, pname, params) => {
				// this.#gl.getTexParameterfv(target, pname, params); // TODO
			},
			glGetTexParameteriv: (target, pname, params) => {
				// this.#gl.getTexParameteriv(target, pname, params); // TODO
			},
			glGetUniformfv: (program, location, params) => {
				// this.#gl.getUniformfv(program, location, params); // TODO
			},
			glGetUniformiv: (program, location, params) => {
				// this.#gl.getUniformiv(program, location, params); // TODO
			},
			glGetUniformLocation: (program, name) => {
				// this.#gl.getUniformLocation(program, name);
			},
			glGetVertexAttribfv: (index, pname, params) => {
				// this.#gl.getVertexAttribfv(index, pname, params); // TODO
			},
			glGetVertexAttribiv: (index, pname, params) => {
				// this.#gl.getVertexAttribiv(index, pname, params); // TODO
			},
			glGetVertexAttribPointerv: (index, pname, pointer) => {
				// this.#gl.getVertexAttribPointerv(index, pname, pointer); // TODO
			},
			glHint: (target, mode) => {
				// this.#gl.hint(target, mode);
			},
			glIsBuffer: (buffer) => {
				// this.#gl.isBuffer(buffer);
			},
			glIsEnabled: (cap) => {
				// this.#gl.isEnabled(cap);
			},
			glIsFramebuffer: (framebuffer) => {
				// this.#gl.isFramebuffer(framebuffer);
			},
			glIsProgram: (program) => {
				// this.#gl.isProgram(program);
			},
			glIsRenderbuffer: (renderbuffer) => {
				// this.#gl.isRenderbuffer(renderbuffer);
			},
			glIsShader: (shader) => {
				// this.#gl.isShader(shader);
			},
			glIsTexture: (texture) => {
				// this.#gl.isTexture(texture);
			},
			glLineWidth: (width) => {
				// this.#gl.lineWidth(width);
			},
			glLinkProgram: (program) => {
				// this.#gl.linkProgram(program);
			},
			glPixelStorei: (pname, param) => {
				// this.#gl.pixelStorei(pname, param);
			},
			glPolygonOffset: (factor, units) => {
				// this.#gl.polygonOffset(factor, units);
			},
			glReadPixels: (x, y, width, height, format, type, pixels) => {
				// this.#gl.readPixels(x, y, width, height, format, type, pixels);
			},
			glReleaseShaderCompiler: () => {
				// this.#gl.releaseShaderCompiler(); // TODO
			},
			glRenderbufferStorage: (target, internalformat, width, height) => {
				// this.#gl.renderbufferStorage(target, internalformat, width, height);
			},
			glSampleCoverage: (value, invert) => {
				// this.#gl.sampleCoverage(value, invert);
			},
			glScissor: (x, y, width, height) => {
				// this.#gl.scissor(x, y, width, height);
			},
			glShaderBinary: (count, shaders, binaryformat, binary, length) => {
				// this.#gl.shaderBinary(count, shaders, binaryformat, binary, length); // TODO
			},
			glShaderSource: (shader, count, string, length) => {
				// this.#gl.shaderSource(shader, count, string, length);
			},
			glStencilFunc: (func, ref, mask) => {
				// this.#gl.stencilFunc(func, ref, mask);
			},
			glStencilFuncSeparate: (face, func, ref, mask) => {
				// this.#gl.stencilFuncSeparate(face, func, ref, mask);
			},
			glStencilMask: (mask) => {
				// this.#gl.stencilMask(mask);
			},
			glStencilMaskSeparate: (face, mask) => {
				// this.#gl.stencilMaskSeparate(face, mask);
			},
			glStencilOp: (fail, zfail, zpass) => {
				// this.#gl.stencilOp(fail, zfail, zpass);
			},
			glStencilOpSeparate: (face, sfail, dpfail, dppass) => {
				// this.#gl.stencilOpSeparate(face, sfail, dpfail, dppass);
			},
			glTexImage2D: (target, level, internalformat, width, height, border, format, type, pixels) => {
				// this.#gl.texImage2D(target, level, internalformat, width, height, border, format, type, pixels);
			},
			glTexParameterf: (target, pname, param) => {
				// this.#gl.texParameterf(target, pname, param);
			},
			glTexParameterfv: (target, pname, params) => {
				// this.#gl.texParameterfv(target, pname, params); // TODO
			},
			glTexParameteri: (target, pname, param) => {
				// this.#gl.texParameteri(target, pname, param);
			},
			glTexParameteriv: (target, pname, params) => {
				// this.#gl.texParameteriv(target, pname, params); // TODO
			},
			glTexSubImage2D: (target, level, xoffset, yoffset, width, height, format, type, pixels) => {
				// this.#gl.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixels);
			},
			glUniform1f: (location, v0) => {
				// this.#gl.uniform1f(location, v0);
			},
			glUniform1fv: (location, count, value) => {
				// this.#gl.uniform1fv(location, count, value);
			},
			glUniform1i: (location, v0) => {
				// this.#gl.uniform1i(location, v0);
			},
			glUniform1iv: (location, count, value) => {
				// this.#gl.uniform1iv(location, count, value);
			},
			glUniform2f: (location, v0, v1) => {
				// this.#gl.uniform2f(location, v0, v1);
			},
			glUniform2fv: (location, count, value) => {
				// this.#gl.uniform2fv(location, count, value);
			},
			glUniform2i: (location, v0, v1) => {
				// this.#gl.uniform2i(location, v0, v1);
			},
			glUniform2iv: (location, count, value) => {
				// this.#gl.uniform2iv(location, count, value);
			},
			glUniform3f: (location, v0, v1, v2) => {
				// this.#gl.uniform3f(location, v0, v1, v2);
			},
			glUniform3fv: (location, count, value) => {
				// this.#gl.uniform3fv(location, count, value);
			},
			glUniform3i: (location, v0, v1, v2) => {
				// this.#gl.uniform3i(location, v0, v1, v2);
			},
			glUniform3iv: (location, count, value) => {
				// this.#gl.uniform3iv(location, count, value);
			},
			glUniform4f: (location, v0, v1, v2, v3) => {
				// this.#gl.uniform4f(location, v0, v1, v2, v3);
			},
			glUniform4fv: (location, count, value) => {
				// this.#gl.uniform4fv(location, count, value);
			},
			glUniform4i: (location, v0, v1, v2, v3) => {
				// this.#gl.uniform4i(location, v0, v1, v2, v3);
			},
			glUniform4iv: (location, count, value) => {
				// this.#gl.uniform4iv(location, count, value);
			},
			glUniformMatrix2fv: (location, count, transpose, value) => {
				// this.#gl.uniformMatrix2fv(location, count, transpose, value);
			},
			glUniformMatrix3fv: (location, count, transpose, value) => {
				// this.#gl.uniformMatrix3fv(location, count, transpose, value);
			},
			glUniformMatrix4fv: (location, count, transpose, value) => {
				// this.#gl.uniformMatrix4fv(location, count, transpose, value);
			},
			glUseProgram: (program) => {
				// this.#gl.useProgram(program);
			},
			glValidateProgram: (program) => {
				// this.#gl.validateProgram(program);
			},
			glVertexAttrib1f: (index, x) => {
				// this.#gl.vertexAttrib1f(index, x);
			},
			glVertexAttrib1fv: (index, v) => {
				// this.#gl.vertexAttrib1fv(index, v);
			},
			glVertexAttrib2f: (index, x, y) => {
				// this.#gl.vertexAttrib2f(index, x, y);
			},
			glVertexAttrib2fv: (index, v) => {
				// this.#gl.vertexAttrib2fv(index, v);
			},
			glVertexAttrib3f: (index, x, y, z) => {
				// this.#gl.vertexAttrib3f(index, x, y, z);
			},
			glVertexAttrib3fv: (index, v) => {
				// this.#gl.vertexAttrib3fv(index, v);
			},
			glVertexAttrib4f: (index, x, y, z, w) => {
				// this.#gl.vertexAttrib4f(index, x, y, z, w);
			},
			glVertexAttrib4fv: (index, v) => {
				// this.#gl.vertexAttrib4fv(index, v);
			},
			glVertexAttribPointer: (index, size, type, normalized, stride, pointer) => {
				// this.#gl.vertexAttribPointer(index, size, type, normalized, stride, pointer);
			},
			glViewport: (x, y, width, height) => {
				// this.#gl.viewport(x, y, width, height);
			},
		}
	}
};
