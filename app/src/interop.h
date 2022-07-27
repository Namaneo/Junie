#pragma once

#include <stdint.h>
#include <stdbool.h>

double JUN_InteropGetPixelRatio();
bool JUN_InteropReadDir(const char *path, size_t index, char **file);
void *JUN_InteropReadFile(const char *path, size_t *length);
void JUN_InteropWriteFile(const char *path, const void *data, size_t length);
void JUN_InteropRemoveFile(const char *path);
