#pragma once

#include <stddef.h>
#include <stdint.h>
#include <stdbool.h>

typedef void (*JUN_InteropOnFile)(char *path, void *data, size_t size, void *opaque);

double JUN_InteropGetPixelRatio();
char *JUN_InteropGetVersion();
bool JUN_InteropReadDir(const char *path, size_t index, char **file);
void *JUN_InteropReadFile(const char *path, size_t *length);
void JUN_InteropWriteFile(const char *path, const void *data, size_t length);
