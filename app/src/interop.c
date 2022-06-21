#include "matoya.h"

#include "interop.h"

void js_trace();
double js_get_pixel_ratio();
void js_refresh_files();
bool js_read_dir(const char *path, size_t index, char *file, size_t length);
void *js_read_file(const char *path, size_t *length);
void js_write_file(const char *path, const void *data, size_t length);

void JUN_InteropTrace()
{
	js_trace();
}

double JUN_InteropGetPixelRatio()
{
	return js_get_pixel_ratio();
}

void JUN_InteropRefreshFiles()
{
	js_refresh_files();
}

bool JUN_InteropReadDir(const char *path, size_t index, char **file)
{
	char value[PATH_SIZE] = {0};
	bool exists = js_read_dir(path, index, value, PATH_SIZE);
	*file = MTY_Strdup(value);
	return exists;
}

void *JUN_InteropReadFile(const char *path, size_t *length)
{
	return js_read_file(path, length);
}

void JUN_InteropWriteFile(const char *path, const void *data, size_t length)
{
	js_write_file(path, data, length);
}
