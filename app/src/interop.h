#pragma once

#include <stdint.h>
#include <stdbool.h>

#define PATH_SIZE 256

void JUN_InteropTrace();
bool JUN_InteropReadDir(const char *path, size_t index, char **file);
void *JUN_InteropReadFile(const char *path, size_t *length);
void JUN_InteropWriteFile(const char *path, const void *data, size_t length);
