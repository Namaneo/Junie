#pragma once

#include <stddef.h>
#include <stdint.h>

#define JUN_Log(msg, ...) JUN_LogParams(__FUNCTION__, msg, __VA_ARGS__)

void JUN_LogParams(const char *func, const char *fmt, ...);
uint64_t JUN_GetTicks();
char *JUN_Strfmt(const char *fmt, ...);
void JUN_ConvertARGB1555(const void *data, uint32_t width, uint32_t height, size_t pitch, uint32_t *rgba);
void JUN_ConvertARGB8888(const void *data, uint32_t width, uint32_t height, size_t pitch, uint32_t *rgba);
void JUN_ConvertRGB565(const void *data, uint32_t width, uint32_t height, size_t pitch, uint32_t *rgba);
void JUN_ConvertPCM16(const int16_t *data, size_t frames, float *converted);
