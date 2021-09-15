#include "matoya.h"

#include "interop.h"

#define PATH_SIZE 256

void js_get_host(char *host, uint32_t length);
uint16_t js_get_port();
bool js_is_secure();

void js_get_system(char *value, uint32_t length);
void js_get_core(char *value, uint32_t length);
void js_get_game(char *value, uint32_t length);

void *js_read_file(const char *path, size_t *length);
void js_write_file(const char *path, const void *data, size_t length);

char *JUN_InteropGetHost()
{
    char value[PATH_SIZE];
    js_get_host(value, PATH_SIZE);
    return MTY_Strdup(value);
}

uint16_t JUN_InteropGetPort()
{
    return js_get_port();
}

bool JUN_InteropIsSecure()
{
    return js_is_secure();
}

char *JUN_InteropGetSystem()
{
    char value[PATH_SIZE];
    js_get_system(value, PATH_SIZE);
    return MTY_Strdup(value);
}

char *JUN_InteropGetCore()
{
    char value[PATH_SIZE];
    js_get_core(value, PATH_SIZE);
    return MTY_Strdup(value);
}

char *JUN_InteropGetGame()
{
    char value[PATH_SIZE];
    js_get_game(value, PATH_SIZE);
    return MTY_Strdup(value);
}

void *JUN_InteropReadFile(const char *path, size_t *length)
{
    return js_read_file(path, length);
}

void JUN_InteropWriteFile(const char *path, const void *data, size_t length)
{
    js_write_file(path, data, length);
}
