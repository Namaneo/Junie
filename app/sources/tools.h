#pragma once

#include <stdint.h>
#include <stdbool.h>

void JUN_Log(const char *fmt, ...);
uint64_t JUN_GetTicks();
char *JUN_Strfmt(const char *fmt, ...);
void *JUN_CopyARGB8888(const void *data, uint32_t width, uint32_t height, size_t pitch);
void *JUN_ConvertARGB1555(const void *data, uint32_t width, uint32_t height, size_t pitch);
void *JUN_ConvertRGB565(const void *data, uint32_t width, uint32_t height, size_t pitch);
