#include "tools.h"

#include <stdio.h>
#include <stdlib.h>
#include <stdarg.h>
#include <string.h>
#include <time.h>

void JUN_Log(const char *fmt, ...)
{
#if defined(DEBUG)
	va_list args = {0};
	va_start(args, fmt);

	size_t format_len = strlen(fmt);
	char *format = calloc(format_len + 2, 1);
	memcpy(format, fmt, format_len);

	if (format[format_len - 1] != '\n')
		format[format_len] = '\n';

	vfprintf(stdout, format, args);
	fflush(stdout);

	free(format);
	va_end(args);
#endif
}

uint64_t JUN_GetTicks()
{
	struct timespec now = {0};
	clock_gettime(CLOCK_MONOTONIC, &now);
	return now.tv_sec * 1000.0 + now.tv_nsec / 1000000.0;
}

char *JUN_Strfmt(const char *fmt, ...)
{
	va_list args;
	va_list args_copy;

	va_start(args, fmt);
	va_copy(args_copy, args);

	size_t size = vsnprintf(NULL, 0, fmt, args_copy) + 1;

	char *str = calloc(size, 1);
	vsnprintf(str, size, fmt, args);

	va_end(args_copy);
	va_end(args);

	return str;
}

void JUN_ConvertARGB1555(const void *data, uint32_t width, uint32_t height, size_t pitch, uint32_t *rgba)
{
	if (!data)
		return;

	for (size_t x = 0; x < width; x++) {
		for (size_t y = 0; y < height; y++) {
			uint32_t color = ((uint16_t *) data)[x + y * (pitch / sizeof(uint16_t))];

			uint32_t r = ((color & 0b0111110000000000) >> 10) << 3;
			uint32_t g = ((color & 0b0000001111100000) >> 5 ) << 11;
			uint32_t b = ((color & 0b0000000000011111) >> 0 ) << 19;
			uint32_t a = color & 0b1000000000000000 ? 0xFF000000 : 0;

			rgba[x + y * width] = r | g | b | a;
		}
	}
}

void JUN_ConvertARGB8888(const void *data, uint32_t width, uint32_t height, size_t pitch, uint32_t *rgba)
{
	if (!data)
		return;

	for (size_t x = 0; x < width; x++) {
		for (size_t y = 0; y < height; y++) {
			uint32_t color = ((uint32_t *) data)[x + y * (pitch / sizeof(uint32_t))];

			uint32_t r = ((color & 0xFF0000) >> 16) << 0;
			uint32_t g = ((color & 0x00FF00) >> 8 ) << 8;
			uint32_t b = ((color & 0x0000FF) >> 0 ) << 16;
			uint32_t a = 0xFF000000;

			rgba[x + y * width] = r | g | b | a;
		}
	}
}

void JUN_ConvertRGB565(const void *data, uint32_t width, uint32_t height, size_t pitch, uint32_t *rgba)
{
	if (!data)
		return;

	for (size_t x = 0; x < width; x++) {
		for (size_t y = 0; y < height; y++) {
			uint32_t color = ((uint16_t *) data)[x + y * (pitch / sizeof(uint16_t))];

			uint32_t r = ((color & 0b1111100000000000) >> 11) << 3;
			uint32_t g = ((color & 0b0000011111100000) >> 5 ) << 10;
			uint32_t b = ((color & 0b0000000000011111) >> 0 ) << 19;
			uint32_t a = 0xFF000000;

			rgba[x + y * width] = r | g | b | a;
		}
	}
}

void JUN_ConvertPCM16(const int16_t *data, size_t frames, float *converted)
{
	for (size_t i = 0; i < frames * 2; i++)
		converted[i] = data[i] / 32768.0f;
}
