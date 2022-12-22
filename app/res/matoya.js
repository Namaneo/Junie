//`yarn global bin`/emscripten-library-generator app/res/matoya.js > app/res/library.js

// Global state

const MTY = {
	gl: null,
	events: {},
};

// GL

function gl_flush () {
	MTY.gl.flush();
}

// Web API (mostly used in app.c)

function scale(num) {
	return Math.round(num * window.devicePixelRatio);
}

function gl_get_size (c_width, c_height) {
	const rect = MTY.gl.canvas.getBoundingClientRect();

	MTY.gl.canvas.width = scale(rect.width);
	MTY.gl.canvas.height = scale(rect.height);

	const view = new DataView(wasmMemory.buffer);
	view.setUint32(c_width, MTY.gl.drawingBufferWidth, true);
	view.setUint32(c_height, MTY.gl.drawingBufferHeight, true);
}

function gl_attach_events (app, mouse_motion, mouse_button) {
	const motion = wasmTable.get(mouse_motion);
	const button = wasmTable.get(mouse_button);

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

			button(app, touch.identifier, true, 0, scale(touch.clientX), scale(touch.clientY));
		}
	};

	var touch_moved = function (ev) {
		const touches = ev.changedTouches;

		for (var i = 0; i < touches.length; i++) {
			const newTouch = touches[i];
			const touchIndex = currentTouches.findIndex(touch => touch.identifier == newTouch.identifier);

			if (touchIndex != -1) {
				const touch = currentTouches[touchIndex];

				let x = scale(newTouch.clientX);
				let y = scale(newTouch.clientY);

				touch.clientX = x;
				touch.clientY = y;

				motion(app, touch.identifier, false, touch.clientX, touch.clientY);
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

				button(app, touch.identifier, false, 0, scale(touch.clientX), scale(touch.clientY));
			}
		}
	};

	MTY.events.resize = () => {
		const rect = MTY.gl.canvas.getBoundingClientRect();

		MTY.gl.canvas.width = scale(rect.width);
		MTY.gl.canvas.height = scale(rect.height);
	};

	MTY.events.mousemove = (ev) => {
		motion(app, 0, false, scale(ev.clientX), scale(ev.clientY));
	}

	MTY.events.mousedown = (ev) => {
		ev.preventDefault();
		button(app, 0, true, ev.button, scale(ev.clientX), scale(ev.clientY));
	}

	MTY.events.mouseup = (ev) => {
		ev.preventDefault();
		button(app, 0, false, ev.button, scale(ev.clientX), scale(ev.clientY));
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
	window.addEventListener('touchstart',  MTY.events.touchstart);
	window.addEventListener('touchmove',   MTY.events.touchmove);
	window.addEventListener('touchend',    MTY.events.touchend);
	window.addEventListener('touchleave',  MTY.events.touchleave);
	window.addEventListener('touchcancel', MTY.events.touchcancel);
}
