#pragma once

#include <stdint.h>

void JUN_Log(const char *fmt, ...);
uint64_t JUN_GetTicks();
char *JUN_Strdup(const char *str);
char *JUN_Strfmt(const char *fmt, ...);
