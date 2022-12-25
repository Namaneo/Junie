mergeInto(LibraryManager.library, {
    gl_flush: function () {
        GLctx.flush();
    },
    gl_get_size: function (c_width, c_height) {
        const rect = GLctx.canvas.getBoundingClientRect();
        GLctx.canvas.width = rect.width * window.devicePixelRatio;
        GLctx.canvas.height = rect.height * window.devicePixelRatio;
        const view = new DataView(wasmMemory.buffer);
        view.setUint32(c_width, GLctx.drawingBufferWidth, true);
        view.setUint32(c_height, GLctx.drawingBufferHeight, true);
    },
    gl_attach_events: function (app, mouse_motion, mouse_button) {
        const motion = wasmTable.get(mouse_motion);
        const button = wasmTable.get(mouse_button);
        var currentTouches = new Array();
        const touch_started = function (ev) {
            const touches = ev.changedTouches;
            for (var i = 0; i < touches.length; i++) {
                const touch = touches[i];
                currentTouches.push({
                    identifier: touch.identifier,
                    clientX: touch.clientX,
                    clientY: touch.clientY
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
        GLctx.canvas.addEventListener('contextmenu', ev => {
            ev.preventDefault();
        });
        GLctx.canvas.addEventListener('mousemove', ev => {
            motion(app, 0, false, ev.clientX, ev.clientY);
        });
        GLctx.canvas.addEventListener('mousedown', ev => {
            ev.preventDefault();
            button(app, 0, true, ev.button, ev.clientX, ev.clientY);
        });
        GLctx.canvas.addEventListener('mouseup', ev => {
            ev.preventDefault();
            button(app, 0, false, ev.button, ev.clientX, ev.clientY);
        });
        GLctx.canvas.addEventListener('touchstart', ev => {
            ev.preventDefault();
            touch_started(ev);
        });
        GLctx.canvas.addEventListener('touchmove', ev => {
            ev.preventDefault();
            touch_moved(ev);
        });
        GLctx.canvas.addEventListener('touchend', ev => {
            ev.preventDefault();
            touch_ended(ev);
        });
        GLctx.canvas.addEventListener('touchleave', ev => {
            ev.preventDefault();
            touch_ended(ev);
        });
        GLctx.canvas.addEventListener('touchcancel', ev => {
            ev.preventDefault();
            touch_ended(ev);
        });
    }
});
