#include <emscripten.h>

#include "matoya.h"
#include "interop.h"

double JUN_InteropGetPixelRatio()
{
	return emscripten_get_device_pixel_ratio();
}

void JUN_InteropShowUI(bool show)
{
	const char *script = show
		? "window.dispatchEvent(new CustomEvent('show_ui', { detail: true } ));"
		: "window.dispatchEvent(new CustomEvent('show_ui', { detail: false } ));";

	emscripten_run_script(script);
}

void *JUN_InteropReadFile(const char *path, int32_t *length)
{
	void *data = NULL;
	int error = 0;

	emscripten_idb_load("Junie", path, &data, length, &error);

	return !error ? data : NULL;
}

void JUN_InteropWriteFile(const char *path, void *data, int32_t length)
{
	int error = 0;

	emscripten_idb_store("Junie", path, (void *) data, length, &error);
}
