#include <string.h>
#include <emscripten.h>
#include <emscripten/html5.h>

#include "matoya.h"
#include "interop.h"

double JUN_InteropGetPixelRatio()
{
	return emscripten_get_device_pixel_ratio();
}

void JUN_InteropShowUI(bool show)
{
	if (!show) {
		EmscriptenWebGLContextAttributes attrs = {0};
		emscripten_webgl_init_context_attributes(&attrs);
		attrs.depth = false;
		attrs.antialias = false;
		attrs.premultipliedAlpha = true;
		EMSCRIPTEN_WEBGL_CONTEXT_HANDLE ctx = emscripten_webgl_create_context("canvas", &attrs);
		emscripten_webgl_make_context_current(ctx);
	}

	const char *script = show
		? "window.dispatchEvent(new CustomEvent('show_ui', { detail: true } ));"
		: "window.dispatchEvent(new CustomEvent('show_ui', { detail: false } ));";

	emscripten_run_script(script);
}

void *JUN_InteropReadFile(const char *path, int32_t *length)
{
	void *data = NULL;
	int32_t size = 0, error = 0;
	emscripten_idb_load("Junie", path, &data, &size, &error);

	if (length) {
		*length = size;

	} else if (data) {
		void *tmp = MTY_Alloc(size + 1, 1);
		memcpy(tmp, data, size);
		MTY_Free(data);
		data = tmp;
	}

	return !error ? data : NULL;
}

void JUN_InteropWriteFile(const char *path, void *data, int32_t length)
{
	int error = 0;

	emscripten_idb_store("Junie", path, (void *) data, length, &error);
}
