#include <stdlib.h>
#include <string.h>
#include <emscripten.h>

#include "interop.h"

static void interop_show_ui(bool show)
{
	const char *script = show
		? "window.dispatchEvent(new CustomEvent('show_ui', { detail: true } ));"
		: "window.dispatchEvent(new CustomEvent('show_ui', { detail: false } ));";

	emscripten_run_script(script);
}

void JUN_InteropStartLoop(JUN_InteropLoopFunc func, void *opqaue)
{
	interop_show_ui(false);
	emscripten_set_main_loop_arg(func, opqaue, 0, 0);
}

void JUN_InteropCancelLoop()
{
	emscripten_cancel_main_loop();
	interop_show_ui(true);
}

void *JUN_InteropReadFile(const char *path, int32_t *length)
{
	void *data = NULL;
	int32_t size = 0, error = 0;
	emscripten_idb_load("Junie", path, &data, &size, &error);

	if (length) {
		*length = size;

	} else if (data) {
		void *tmp = calloc(size + 1, 1);
		memcpy(tmp, data, size);
		free(data);
		data = tmp;
	}

	return !error ? data : NULL;
}

void JUN_InteropWriteFile(const char *path, void *data, int32_t length)
{
	int error = 0;

	emscripten_idb_store("Junie", path, (void *) data, length, &error);
}
