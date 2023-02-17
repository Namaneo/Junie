#include <stdio.h>
#include <stdlib.h>
#include <stdarg.h>
#include <string.h>
#include <time.h>

#include "tools.h"

void JUN_Log(const char *fmt, ...)
{
#if defined(DEBUG)
	va_list args = {0};
	va_start(args, fmt);

	size_t format_len = strlen(fmt);
	char *format = calloc(strlen(fmt) + 2, 1);
	memcpy(format, fmt, format_len);

	if (format[format_len - 1] != '\n')
		format[format_len] = '\n';

	vprintf(format, args);

	free(format);
	va_end(args);
#endif
}
#include <SDL2/SDL.h>
uint64_t JUN_GetTicks()
{
	struct timespec now = {0};
	clock_gettime(CLOCK_MONOTONIC, &now);
	return now.tv_sec * 1000.0 + now.tv_nsec / 1000000.0;
}

char *JUN_Strdup(const char *str)
{
	size_t size = strlen(str);
	char *dup = calloc(size + 1, 1);
	memcpy(dup, str, size);
	return dup;
}

char *JUN_Strfmt(const char *fmt, ...)
{
	va_list args = {0};
	va_start(args, fmt);

	va_list copy = {0};
	va_copy(copy, args);
	int32_t length = vsprintf(NULL, fmt, copy);
	va_end(copy);

	char *str = calloc(length + 1, 1);
	vsprintf(str, fmt, args);

	va_end(args);

	return str;
}
