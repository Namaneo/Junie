mergeInto(LibraryManager.library, {
    MTY: {
        module: null,
        audio: null,
        gl: null,
        keys: {},
        events: {}
    },
    mty_mem: function () {
        return wasmMemory.buffer;
    },
    mty_mem_view__deps: ['mty_mem'],
    mty_mem_view: function () {
        return new DataView(_mty_mem());
    },
    mty_char_to_js: function (buf) {
        let str = '';
        for (let x = 0; x < 2147483647 && x < buf.length; x++) {
            if (buf[x] == 0)
                break;
            str += String.fromCharCode(buf[x]);
        }
        return str;
    },
    MTY_CFunc: function (ptr) {
        return wasmTable.get(ptr);
    },
    MTY_Alloc__deps: ['MTY'],
    MTY_Alloc: function (size, el) {
        return _MTY.module._calloc(size, el ? el : 1);
    },
    MTY_Free__deps: ['MTY'],
    MTY_Free: function (ptr) {
        _MTY.module._free(ptr);
    },
    MTY_SetUint32__deps: ['mty_mem_view'],
    MTY_SetUint32: function (ptr, value) {
        _mty_mem_view().setUint32(ptr, value, true);
    },
    MTY_Memcpy__deps: ['mty_mem'],
    MTY_Memcpy: function (cptr, abuffer) {
        const heap = new Uint8Array(_mty_mem(), cptr, abuffer.length);
        heap.set(abuffer);
    },
    MTY_StrToJS__deps: [
        'mty_char_to_js',
        'mty_mem'
    ],
    MTY_StrToJS: function (ptr) {
        return _mty_char_to_js(new Uint8Array(_mty_mem(), ptr));
    },
    MTY_StrToC__deps: ['mty_mem'],
    MTY_StrToC: function (js_str, ptr, size) {
        const view = new Uint8Array(_mty_mem(), ptr);
        let len = 0;
        for (; len < js_str.length && len < size - 1; len++)
            view[len] = js_str.charCodeAt(len);
        view[len] = 0;
        return ptr;
    },
    web_gl_flush__deps: ['MTY'],
    web_gl_flush: function () {
        _MTY.gl.flush();
    },
    mty_audio_queued_ms__deps: ['MTY'],
    mty_audio_queued_ms: function () {
        let queued_ms = Math.round((_MTY.audio.next_time - _MTY.audio.ctx.currentTime) * 1000);
        let buffered_ms = Math.round(_MTY.audio.offset / 4 / _MTY.audio.frames_per_ms);
        return (queued_ms < 0 ? 0 : queued_ms) + buffered_ms;
    },
    MTY_AudioCreate__deps: [
        'MTY',
        'MTY_Alloc'
    ],
    MTY_AudioCreate: function (sampleRate, minBuffer, maxBuffer) {
        _MTY.audio = {};
        _MTY.audio.flushing = false;
        _MTY.audio.playing = false;
        _MTY.audio.sample_rate = sampleRate;
        _MTY.audio.frames_per_ms = Math.round(sampleRate / 1000);
        _MTY.audio.min_buffer = minBuffer * _MTY.audio.frames_per_ms;
        _MTY.audio.max_buffer = maxBuffer * _MTY.audio.frames_per_ms;
        _MTY.audio.offset = 0;
        _MTY.audio.buf = _MTY_Alloc(sampleRate * 4);
        return 3293;
    },
    MTY_AudioDestroy__deps: [
        'MTY_Free',
        'MTY',
        'MTY_SetUint32'
    ],
    MTY_AudioDestroy: function (audio) {
        _MTY_Free(_MTY.audio.buf);
        _MTY_SetUint32(audio, 0);
        _MTY.audio = null;
    },
    MTY_AudioQueue__deps: [
        'MTY',
        'mty_audio_queued_ms',
        'MTY_Memcpy',
        'mty_mem'
    ],
    MTY_AudioQueue: function (ctx, frames, count) {
        if (!_MTY.audio.ctx)
            _MTY.audio.ctx = new AudioContext();
        let queued_frames = _MTY.audio.frames_per_ms * _mty_audio_queued_ms();
        if (queued_frames > _MTY.audio.max_buffer) {
            _MTY.audio.playing = false;
            _MTY.audio.flushing = true;
        }
        if (queued_frames == 0) {
            _MTY.audio.flushing = false;
            _MTY.audio.playing = false;
        }
        if (!_MTY.audio.flushing) {
            let size = count * 4;
            _MTY_Memcpy(_MTY.audio.buf + _MTY.audio.offset, new Uint8Array(_mty_mem(), frames, size));
            _MTY.audio.offset += size;
        }
        if (!_MTY.audio.playing && !_MTY.audio.flushing && _MTY.audio.offset / 4 > _MTY.audio.min_buffer) {
            _MTY.audio.next_time = _MTY.audio.ctx.currentTime;
            _MTY.audio.playing = true;
        }
        if (_MTY.audio.playing) {
            const src = new Int16Array(_mty_mem(), _MTY.audio.buf);
            const bcount = _MTY.audio.offset / 4;
            const buf = _MTY.audio.ctx.createBuffer(2, bcount, _MTY.audio.sample_rate);
            const left = buf.getChannelData(0);
            const right = buf.getChannelData(1);
            let offset = 0;
            for (let x = 0; x < bcount * 2; x += 2) {
                left[offset] = src[x] / 32768;
                right[offset] = src[x + 1] / 32768;
                offset++;
            }
            const source = _MTY.audio.ctx.createBufferSource();
            source.buffer = buf;
            source.connect(_MTY.audio.ctx.destination);
            source.start(_MTY.audio.next_time);
            _MTY.audio.next_time += buf.duration;
            _MTY.audio.offset = 0;
        }
    },
    mty_decompress_image: function (input, func) {
        const img = new Image();
        img.src = URL.createObjectURL(new Blob([input]));
        img.decode().then(() => {
            const width = img.naturalWidth;
            const height = img.naturalHeight;
            let canvas = null;
            if (typeof OffscreenCanvas !== 'undefined') {
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
    },
    MTY_DecompressImageAsync__deps: [
        'mty_mem',
        'mty_decompress_image',
        'MTY_Alloc',
        'MTY_Memcpy',
        'MTY_CFunc'
    ],
    MTY_DecompressImageAsync: function (input, size, func, opaque) {
        const jinput = new Uint8Array(_mty_mem(), input, size);
        _mty_decompress_image(jinput, (image, width, height) => {
            const cimage = _MTY_Alloc(width * height * 4);
            _MTY_Memcpy(cimage, image);
            _MTY_CFunc(func)(cimage, width, height, opaque);
        });
    },
    mty_get_mods: function (ev) {
        let mods = 0;
        if (ev.shiftKey)
            mods |= 1;
        if (ev.ctrlKey)
            mods |= 2;
        if (ev.altKey)
            mods |= 4;
        if (ev.metaKey)
            mods |= 8;
        if (ev.getModifierState('CapsLock'))
            mods |= 16;
        if (ev.getModifierState('NumLock'))
            mods |= 32;
        return mods;
    },
    mty_scaled: function (num) {
        return Math.round(num * window.devicePixelRatio);
    },
    web_set_mem_funcs: function (alloc, free) {
    },
    web_set_key__deps: [
        'MTY_StrToJS',
        'MTY'
    ],
    web_set_key: function (reverse, code, key) {
        const str = _MTY_StrToJS(code);
        _MTY.keys[str] = key;
    },
    web_get_size__deps: [
        'MTY_SetUint32',
        'MTY'
    ],
    web_get_size: function (c_width, c_height) {
        _MTY_SetUint32(c_width, _MTY.gl.drawingBufferWidth);
        _MTY_SetUint32(c_height, _MTY.gl.drawingBufferHeight);
    },
    web_set_title__deps: ['MTY_StrToJS'],
    web_set_title: function (title) {
        document.title = _MTY_StrToJS(title);
    },
    web_attach_events__deps: [
        'MTY_CFunc',
        'mty_scaled',
        'MTY',
        'MTY_Alloc',
        'MTY_StrToC',
        'mty_get_mods',
        'MTY_Free'
    ],
    web_attach_events: function (app, mouse_motion, mouse_button, mouse_wheel, keyboard, focus, drop, resize) {
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
                _MTY_CFunc(mouse_button)(app, touch.identifier, true, 0, _mty_scaled(touch.clientX), _mty_scaled(touch.clientY));
            }
        };
        var touch_moved = function (ev) {
            const touches = ev.changedTouches;
            for (var i = 0; i < touches.length; i++) {
                const newTouch = touches[i];
                const touchIndex = currentTouches.findIndex(touch => touch.identifier == newTouch.identifier);
                if (touchIndex != -1) {
                    const touch = currentTouches[touchIndex];
                    let x = _mty_scaled(newTouch.clientX);
                    let y = _mty_scaled(newTouch.clientY);
                    touch.clientX = x;
                    touch.clientY = y;
                    _MTY_CFunc(mouse_motion)(app, touch.identifier, false, touch.clientX, touch.clientY);
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
                    _MTY_CFunc(mouse_button)(app, touch.identifier, false, 0, _mty_scaled(touch.clientX), _mty_scaled(touch.clientY));
                }
            }
        };
        _MTY.events.resize = ev => {
            const rect = _MTY.gl.canvas.getBoundingClientRect();
            _MTY.gl.canvas.width = _mty_scaled(rect.width);
            _MTY.gl.canvas.height = _mty_scaled(rect.height);
            _MTY_CFunc(resize)(app);
        };
        _MTY.events.mousemove = ev => {
            _MTY_CFunc(mouse_motion)(app, 0, false, _mty_scaled(ev.clientX), _mty_scaled(ev.clientY));
        };
        _MTY.events.mousedown = ev => {
            ev.preventDefault();
            _MTY_CFunc(mouse_button)(app, 0, true, ev.button, _mty_scaled(ev.clientX), _mty_scaled(ev.clientY));
        };
        _MTY.events.mouseup = ev => {
            ev.preventDefault();
            _MTY_CFunc(mouse_button)(app, 0, false, ev.button, _mty_scaled(ev.clientX), _mty_scaled(ev.clientY));
        };
        _MTY.events.keydown = ev => {
            const key = _MTY.keys[ev.code];
            if (key != undefined) {
                const cbuf = _MTY_Alloc(1024);
                const text = ev.key.length == 1 ? _MTY_StrToC(ev.key, cbuf, 1024) : 0;
                if (_MTY_CFunc(keyboard)(app, true, key, text, _mty_get_mods(ev)))
                    ev.preventDefault();
                _MTY_Free(cbuf);
            }
        };
        _MTY.events.keyup = ev => {
            const key = _MTY.keys[ev.code];
            if (key != undefined)
                if (_MTY_CFunc(keyboard)(app, false, key, 0, _mty_get_mods(ev)))
                    ev.preventDefault();
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
        window.addEventListener('keydown', _MTY.events.keydown);
        window.addEventListener('keyup', _MTY.events.keyup);
        window.addEventListener('touchstart', _MTY.events.touchstart);
        window.addEventListener('touchmove', _MTY.events.touchmove);
        window.addEventListener('touchend', _MTY.events.touchend);
        window.addEventListener('touchleave', _MTY.events.touchleave);
        window.addEventListener('touchcancel', _MTY.events.touchcancel);
    },
    web_raf__deps: [
        'MTY',
        'mty_scaled'
    ],
    web_raf: function (app, func, controller, move, opaque) {
        const rect = _MTY.gl.canvas.getBoundingClientRect();
        _MTY.gl.canvas.width = _mty_scaled(rect.width);
        _MTY.gl.canvas.height = _mty_scaled(rect.height);
    },
    web_view_destroy: function () {
    },
    web_view_resize: function (hidden) {
    }
});
