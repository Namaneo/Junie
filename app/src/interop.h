#pragma once

#include <stddef.h>
#include <stdint.h>
#include <stdbool.h>
#include <emscripten.h>

double JUN_InteropGetPixelRatio();
void JUN_InteropShowUI(bool show);
void *JUN_InteropReadFile(const char *path, int32_t *length);
void JUN_InteropWriteFile(const char *path, void *data, int32_t length);
