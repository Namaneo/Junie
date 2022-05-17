#include "matoya.h"

#include "interop.h"

void js_get_system(char *value, uint32_t length);
void js_get_game(char *value, uint32_t length);

bool js_read_dir(const char *path, size_t index, char *file, size_t length);
void *js_read_file(const char *path, size_t *length);
void js_write_file(const char *path, const void *data, size_t length);

char *JUN_InteropGetSystem()
{
	char value[PATH_SIZE] = {0};
	js_get_system(value, PATH_SIZE);
	return MTY_Strdup(value);
}

char *JUN_InteropGetGame()
{
	char value[PATH_SIZE] = {0};
	js_get_game(value, PATH_SIZE);
	return MTY_Strdup(value);
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
