#include <string.h>

#include "matoya.h"
#include "interop.h"

#if defined(__EMSCRIPTEN__)

#include <emscripten.h>

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

#else

void *JUN_InteropReadFile(const char *path, int32_t *length)
{
	size_t size = 0;
	void *data = MTY_ReadFile(MTY_SprintfDL("./games/%s", path), &size);

	if (length)
		*length = size;

	return data;
}

void JUN_InteropWriteFile(const char *path, void *data, int32_t length)
{
	char *dir = (char *) MTY_SprintfDL("./games/%s", path);
	strrchr(dir, '/')[0] = '\0';
	MTY_Mkdir(dir);

	MTY_WriteFile(MTY_SprintfDL("./games/%s", path), data, length);
}

#endif
