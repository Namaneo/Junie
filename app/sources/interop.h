#pragma once

#include <stddef.h>
#include <stdint.h>
#include <stdbool.h>

typedef void (*JUN_InteropLoopFunc)(void *opaque);

void JUN_InteropStartLoop(JUN_InteropLoopFunc func, void *opqaue);
void JUN_InteropCancelLoop();
void *JUN_InteropReadFile(const char *path, int32_t *length);
void JUN_InteropWriteFile(const char *path, void *data, int32_t length);
