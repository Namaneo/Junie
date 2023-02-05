#include <stdlib.h>
#include <string.h>
#include <emscripten.h>

#include "interop.h"

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
