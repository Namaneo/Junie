//`yarn global bin`/emscripten-library-generator ../app/res/matoya.js > ../app/res/library.js

// Global state

const MTY = {
	module: null,
	audio: null,
	gl: null,
	keys: {},
	events: {},
};


// Private helpers

function mty_mem() {
	return wasmMemory.buffer;
}

function mty_mem_view() {
	return new DataView(mty_mem());
}

function mty_char_to_js(buf) {
	let str = '';

	for (let x = 0; x < 0x7FFFFFFF && x < buf.length; x++) {
		if (buf[x] == 0)
			break;

		str += String.fromCharCode(buf[x]);
	}

	return str;
}


// WASM utility

function MTY_CFunc(ptr) {
	return wasmTable.get(ptr);
}

function MTY_Alloc(size, el) {
	return MTY.module._calloc(size, el ? el : 1);
}

function MTY_Free(ptr) {
	MTY.module._free(ptr);
}

function MTY_SetUint32(ptr, value) {
	mty_mem_view().setUint32(ptr, value, true);
}

function MTY_Memcpy(cptr, abuffer) {
	const heap = new Uint8Array(mty_mem(), cptr, abuffer.length);
	heap.set(abuffer);
}

function MTY_StrToJS(ptr) {
	return mty_char_to_js(new Uint8Array(mty_mem(), ptr));
}

function MTY_StrToC(js_str, ptr, size) {
	const view = new Uint8Array(mty_mem(), ptr);

	let len = 0;
	for (; len < js_str.length && len < size - 1; len++)
		view[len] = js_str.charCodeAt(len);

	// '\0' character
	view[len] = 0;

	return ptr;
}

// GL

function web_gl_flush () {
	MTY.gl.flush();
}

// Audio

function mty_audio_queued_ms() {
	let queued_ms = Math.round((MTY.audio.next_time - MTY.audio.ctx.currentTime) * 1000.0);
	let buffered_ms = Math.round((MTY.audio.offset / 4) / MTY.audio.frames_per_ms);

	return (queued_ms < 0 ? 0 : queued_ms) + buffered_ms;
}

function MTY_AudioCreate (sampleRate, minBuffer, maxBuffer) {
	MTY.audio = {};
	MTY.audio.flushing = false;
	MTY.audio.playing = false;
	MTY.audio.sample_rate = sampleRate;

	MTY.audio.frames_per_ms = Math.round(sampleRate / 1000.0);
	MTY.audio.min_buffer = minBuffer * MTY.audio.frames_per_ms;
	MTY.audio.max_buffer = maxBuffer * MTY.audio.frames_per_ms;

	MTY.audio.offset = 0;
	MTY.audio.buf = MTY_Alloc(sampleRate * 4);

	return 0xCDD;
}

function MTY_AudioDestroy (audio) {
	MTY_Free(MTY.audio.buf);
	MTY_SetUint32(audio, 0);
	MTY.audio = null;
}

function MTY_AudioQueue (ctx, frames, count) {
	// Initialize on first queue otherwise the browser may complain about user interaction
	if (!MTY.audio.ctx)
		MTY.audio.ctx = new AudioContext();

	let queued_frames = MTY.audio.frames_per_ms * mty_audio_queued_ms();

	// Stop playing and flush if we've exceeded the maximum buffer
	if (queued_frames > MTY.audio.max_buffer) {
		MTY.audio.playing = false;
		MTY.audio.flushing = true;
	}

	// Stop flushing when the queue reaches zero
	if (queued_frames == 0) {
		MTY.audio.flushing = false;
		MTY.audio.playing = false;
	}

	// Convert PCM int16_t to float
	if (!MTY.audio.flushing) {
		let size = count * 4;
		MTY_Memcpy(MTY.audio.buf + MTY.audio.offset, new Uint8Array(mty_mem(), frames, size));
		MTY.audio.offset += size;
	}

	// Begin playing again if the buffer has accumulated past the min
	if (!MTY.audio.playing && !MTY.audio.flushing && MTY.audio.offset / 4 > MTY.audio.min_buffer) {
		MTY.audio.next_time = MTY.audio.ctx.currentTime;
		MTY.audio.playing = true;
	}

	// Queue the audio if playing
	if (MTY.audio.playing) {
		const src = new Int16Array(mty_mem(), MTY.audio.buf);
		const bcount = MTY.audio.offset / 4;

		const buf = MTY.audio.ctx.createBuffer(2, bcount, MTY.audio.sample_rate);
		const left = buf.getChannelData(0);
		const right = buf.getChannelData(1);

		let offset = 0;
		for (let x = 0; x < bcount * 2; x += 2) {
			left[offset] = src[x] / 32768;
			right[offset] = src[x + 1] / 32768;
			offset++;
		}

		const source = MTY.audio.ctx.createBufferSource();
		source.buffer = buf;
		source.connect(MTY.audio.ctx.destination);
		source.start(MTY.audio.next_time);

		MTY.audio.next_time += buf.duration;
		MTY.audio.offset = 0;
	}
}


// Image

function mty_decompress_image(input, func) {
	const img = new Image();
	img.src = URL.createObjectURL(new Blob([input]));

	img.decode().then(() => {
		const width = img.naturalWidth;
		const height = img.naturalHeight;

		let canvas = null;
		if (typeof OffscreenCanvas !== "undefined") {
			canvas = new OffscreenCanvas(width, height);

		} else {
			canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;
		}

		const ctx = canvas.getContext('2d');
		ctx.drawImage(img, 0, 0, width, height);

		const imgData = ctx.getImageData(0, 0, width, height);

		func(imgData.data, width, height);
	});
}

function MTY_DecompressImageAsync (input, size, func, opaque) {
	const jinput = new Uint8Array(mty_mem(), input, size);

	mty_decompress_image(jinput, (image, width, height) => {
		const cimage = MTY_Alloc(width * height * 4);
		MTY_Memcpy(cimage, image);

		MTY_CFunc(func)(cimage, width, height, opaque);
	});
}



// Web API (mostly used in app.c)

function mty_get_mods(ev) {
	let mods = 0;

	if (ev.shiftKey) mods |= 0x01;
	if (ev.ctrlKey)  mods |= 0x02;
	if (ev.altKey)   mods |= 0x04;
	if (ev.metaKey)  mods |= 0x08;

	if (ev.getModifierState("CapsLock")) mods |= 0x10;
	if (ev.getModifierState("NumLock") ) mods |= 0x20;

	return mods;
}

function mty_scaled(num) {
	return Math.round(num * window.devicePixelRatio);
}

function web_set_mem_funcs (alloc, free) {

}

function web_set_key (reverse, code, key) {
	const str = MTY_StrToJS(code);
	MTY.keys[str] = key;
}

function web_get_size (c_width, c_height) {
	MTY_SetUint32(c_width, MTY.gl.drawingBufferWidth);
	MTY_SetUint32(c_height, MTY.gl.drawingBufferHeight);
}

function web_set_title (title) {
	document.title = MTY_StrToJS(title);
}

function web_attach_events (app, mouse_motion, mouse_button, mouse_wheel, keyboard, focus, drop, resize) {
	var currentTouches = new Array;

	var touch_started = function (ev) {
		const touches = ev.changedTouches;

		for (var i = 0; i < touches.length; i++) {
			const touch = touches[i];

			currentTouches.push({
				identifier: touch.identifier,
				clientX: touch.clientX,
				clientY: touch.clientY,
			});

			MTY_CFunc(mouse_button)(app, touch.identifier, true, 0, mty_scaled(touch.clientX), mty_scaled(touch.clientY));
		}
	};

	var touch_moved = function (ev) {
		const touches = ev.changedTouches;

		for (var i = 0; i < touches.length; i++) {
			const newTouch = touches[i];
			const touchIndex = currentTouches.findIndex(touch => touch.identifier == newTouch.identifier);

			if (touchIndex != -1) {
				const touch = currentTouches[touchIndex];

				let x = mty_scaled(newTouch.clientX);
				let y = mty_scaled(newTouch.clientY);

				touch.clientX = x;
				touch.clientY = y;

				MTY_CFunc(mouse_motion)(app, touch.identifier, false, touch.clientX, touch.clientY);
			}
		}
	};

	var touch_ended = function (ev) {
		const touches = ev.changedTouches;

		for (var i = 0; i < touches.length; i++) {
			const newTouch = touches[i];
			const touchIndex = currentTouches.findIndex(touch => touch.identifier == newTouch.identifier);

			if (touchIndex != -1) {
				const touch = currentTouches[touchIndex];

				currentTouches.splice(touchIndex, 1);

				MTY_CFunc(mouse_button)(app, touch.identifier, false, 0, mty_scaled(touch.clientX), mty_scaled(touch.clientY));
			}
		}
	};

	MTY.events.resize = (ev) => {
		const rect = MTY.gl.canvas.getBoundingClientRect();

		MTY.gl.canvas.width = mty_scaled(rect.width);
		MTY.gl.canvas.height = mty_scaled(rect.height);

		MTY_CFunc(resize)(app);
	};

	MTY.events.mousemove = (ev) => {
		MTY_CFunc(mouse_motion)(app, 0, false, mty_scaled(ev.clientX), mty_scaled(ev.clientY));
	}

	MTY.events.mousedown = (ev) => {
		ev.preventDefault();
		MTY_CFunc(mouse_button)(app, 0, true, ev.button, mty_scaled(ev.clientX), mty_scaled(ev.clientY));
	}

	MTY.events.mouseup = (ev) => {
		ev.preventDefault();
		MTY_CFunc(mouse_button)(app, 0, false, ev.button, mty_scaled(ev.clientX), mty_scaled(ev.clientY));
	}

	MTY.events.keydown = (ev) => {
		const key = MTY.keys[ev.code];

		if (key != undefined) {
			const cbuf = MTY_Alloc(1024);
			const text = ev.key.length == 1 ? MTY_StrToC(ev.key, cbuf, 1024) : 0;

			if (MTY_CFunc(keyboard)(app, true, key, text, mty_get_mods(ev)))
				ev.preventDefault();
			MTY_Free(cbuf);
		}
	}

	MTY.events.keyup = (ev) => {
		const key = MTY.keys[ev.code];

		if (key != undefined)
			if (MTY_CFunc(keyboard)(app, false, key, 0, mty_get_mods(ev)))
				ev.preventDefault();
	}

	MTY.events.touchstart = (ev) => {
		ev.preventDefault();
		touch_started(ev);
	}

	MTY.events.touchmove = (ev) => {
		ev.preventDefault();
		touch_moved(ev);
	}

	MTY.events.touchend = (ev) => {
		ev.preventDefault();
		touch_ended(ev);
	}

	MTY.events.touchleave = (ev) => {
		ev.preventDefault();
		touch_ended(ev);
	}

	MTY.events.touchcancel = (ev) => {
		ev.preventDefault();
		touch_ended(ev);
	}

	window.addEventListener('resize',      MTY.events.resize);
	window.addEventListener('mousemove',   MTY.events.mousemove);
	window.addEventListener('mousedown',   MTY.events.mousedown);
	window.addEventListener('mouseup',     MTY.events.mouseup);
	window.addEventListener('keydown',     MTY.events.keydown);
	window.addEventListener('keyup',       MTY.events.keyup);
	window.addEventListener('touchstart',  MTY.events.touchstart);
	window.addEventListener('touchmove',   MTY.events.touchmove);
	window.addEventListener('touchend',    MTY.events.touchend);
	window.addEventListener('touchleave',  MTY.events.touchleave);
	window.addEventListener('touchcancel', MTY.events.touchcancel);
}

function web_raf (app, func, controller, move, opaque) {
	const rect = MTY.gl.canvas.getBoundingClientRect();

	MTY.gl.canvas.width = mty_scaled(rect.width);
	MTY.gl.canvas.height = mty_scaled(rect.height);
}

function web_view_destroy () {

}

function web_view_resize (hidden) {

}
