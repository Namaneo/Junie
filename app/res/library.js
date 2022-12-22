mergeInto(LibraryManager.library, {
    MTY: {
        gl: null,
        events: {}
    },
    gl_flush__deps: ['MTY'],
    gl_flush: function () {
        _MTY.gl.flush();
    },
    scale: function (num) {
        return Math.round(num * window.devicePixelRatio);
    },
    gl_get_size__deps: [
        'MTY',
        'scale'
    ],
    gl_get_size: function (c_width, c_height) {
        const rect = _MTY.gl.canvas.getBoundingClientRect();
        _MTY.gl.canvas.width = _scale(rect.width);
        _MTY.gl.canvas.height = _scale(rect.height);
        const view = new DataView(wasmMemory.buffer);
        view.setUint32(c_width, _MTY.gl.drawingBufferWidth, true);
        view.setUint32(c_height, _MTY.gl.drawingBufferHeight, true);
    },
    gl_attach_events__deps: [
        'scale',
        'MTY'
    ],
    gl_attach_events: function (app, mouse_motion, mouse_button) {
        const motion = wasmTable.get(mouse_motion);
        const button = wasmTable.get(mouse_button);
        var currentTouches = new Array();
        var touch_started = function (ev) {
            const touches = ev.changedTouches;
            for (var i = 0; i < touches.length; i++) {
                const touch = touches[i];
                currentTouches.push({
                    identifier: touch.identifier,
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
                button(app, touch.identifier, true, 0, _scale(touch.clientX), _scale(touch.clientY));
            }
        };
        var touch_moved = function (ev) {
            const touches = ev.changedTouches;
            for (var i = 0; i < touches.length; i++) {
                const newTouch = touches[i];
                const touchIndex = currentTouches.findIndex(touch => touch.identifier == newTouch.identifier);
                if (touchIndex != -1) {
                    const touch = currentTouches[touchIndex];
                    let x = _scale(newTouch.clientX);
                    let y = _scale(newTouch.clientY);
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
                    button(app, touch.identifier, false, 0, _scale(touch.clientX), _scale(touch.clientY));
                }
            }
        };
        _MTY.events.resize = () => {
            const rect = _MTY.gl.canvas.getBoundingClientRect();
            _MTY.gl.canvas.width = _scale(rect.width);
            _MTY.gl.canvas.height = _scale(rect.height);
        };
        _MTY.events.mousemove = ev => {
            motion(app, 0, false, _scale(ev.clientX), _scale(ev.clientY));
        };
        _MTY.events.mousedown = ev => {
            ev.preventDefault();
            button(app, 0, true, ev.button, _scale(ev.clientX), _scale(ev.clientY));
        };
        _MTY.events.mouseup = ev => {
            ev.preventDefault();
            button(app, 0, false, ev.button, _scale(ev.clientX), _scale(ev.clientY));
        };
        _MTY.events.touchstart = ev => {
            ev.preventDefault();
            touch_started(ev);
        };
        _MTY.events.touchmove = ev => {
            ev.preventDefault();
            touch_moved(ev);
        };
        _MTY.events.touchend = ev => {
            ev.preventDefault();
            touch_ended(ev);
        };
        _MTY.events.touchleave = ev => {
            ev.preventDefault();
            touch_ended(ev);
        };
        _MTY.events.touchcancel = ev => {
            ev.preventDefault();
            touch_ended(ev);
        };
        window.addEventListener('resize', _MTY.events.resize);
        window.addEventListener('mousemove', _MTY.events.mousemove);
        window.addEventListener('mousedown', _MTY.events.mousedown);
        window.addEventListener('mouseup', _MTY.events.mouseup);
        window.addEventListener('touchstart', _MTY.events.touchstart);
        window.addEventListener('touchmove', _MTY.events.touchmove);
        window.addEventListener('touchend', _MTY.events.touchend);
        window.addEventListener('touchleave', _MTY.events.touchleave);
        window.addEventListener('touchcancel', _MTY.events.touchcancel);
    }
});
