function get_size(c_width, c_height) {
	const rect = Module.canvas.getBoundingClientRect();

	Module.canvas.width = rect.width;
	Module.canvas.height = rect.height;

	const view = new DataView(wasmMemory.buffer);
	view.setInt32(c_width, rect.width, true);
	view.setInt32(c_height, rect.height, true);
}

function attach_events(app, mouse_motion, mouse_button) {
	const motion = wasmTable.get(mouse_motion);
	const button = wasmTable.get(mouse_button);

	var currentTouches = new Array;

	const touch_started = function (ev) {
		const touches = ev.changedTouches;

		for (var i = 0; i < touches.length; i++) {
			const touch = touches[i];

			currentTouches.push({
				identifier: touch.identifier,
				clientX: touch.clientX,
				clientY: touch.clientY,
			});

			button(app, touch.identifier, true, 0, touch.clientX, touch.clientY);
		}
	};

	const touch_moved = function (ev) {
		const touches = ev.changedTouches;

		for (var i = 0; i < touches.length; i++) {
			const newTouch = touches[i];
			const touchIndex = currentTouches.findIndex(touch => touch.identifier == newTouch.identifier);

			if (touchIndex != -1) {
				const touch = currentTouches[touchIndex];

				touch.clientX = newTouch.clientX;
				touch.clientY = newTouch.clientY;

				motion(app, touch.identifier, false, touch.clientX, touch.clientY);
			}
		}
	};

	const touch_ended = function (ev) {
		const touches = ev.changedTouches;

		for (var i = 0; i < touches.length; i++) {
			const newTouch = touches[i];
			const touchIndex = currentTouches.findIndex(touch => touch.identifier == newTouch.identifier);

			if (touchIndex != -1) {
				const touch = currentTouches[touchIndex];

				currentTouches.splice(touchIndex, 1);

				button(app, touch.identifier, false, 0, touch.clientX, touch.clientY);
			}
		}
	};

	Module.canvas.addEventListener('contextmenu', (ev) => {
		ev.preventDefault();
	});

	Module.canvas.addEventListener('mousemove', (ev) => {
		motion(app, 0, false, ev.clientX, ev.clientY);
	});

	Module.canvas.addEventListener('mousedown', (ev) => {
		ev.preventDefault();
		button(app, 0, true, ev.button, ev.clientX, ev.clientY);
	});

	Module.canvas.addEventListener('mouseup', (ev) => {
		ev.preventDefault();
		button(app, 0, false, ev.button, ev.clientX, ev.clientY);
	});

	Module.canvas.addEventListener('touchstart', (ev) => {
		ev.preventDefault();
		touch_started(ev);
	});

	Module.canvas.addEventListener('touchmove', (ev) => {
		ev.preventDefault();
		touch_moved(ev);
	});

	Module.canvas.addEventListener('touchend', (ev) => {
		ev.preventDefault();
		touch_ended(ev);
	});

	Module.canvas.addEventListener('touchleave', (ev) => {
		ev.preventDefault();
		touch_ended(ev);
	});

	Module.canvas.addEventListener('touchcancel', (ev) => {
		ev.preventDefault();
		touch_ended(ev);
	});
}

mergeInto(LibraryManager.library, {
	get_size: get_size,
	attach_events: attach_events,
});
