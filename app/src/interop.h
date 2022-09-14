#pragma once

#include <stdint.h>
#include <stdbool.h>

typedef void (*JUN_InteropOnFile)(char *path, void *data, size_t size, void *opaque);

double JUN_InteropGetPixelRatio();
bool JUN_InteropReadDir(const char *path, size_t index, char **file);
void JUN_InteropReadFile(const char *path, JUN_InteropOnFile callback, void *opaque);
void JUN_InteropWriteFile(const char *path, const void *data, size_t length);
void JUN_InteropRemoveFile(const char *path);
