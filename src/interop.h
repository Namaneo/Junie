#pragma once

#include <stdint.h>
#include <stdbool.h>

char *JUN_InteropGetHost();
uint16_t JUN_InteropGetPort();
bool JUN_InteropIsSecure();

char *JUN_InteropGetSystem();
char *JUN_InteropGetCore();
char *JUN_InteropGetGame();

void *JUN_InteropReadFile(const char *path, size_t *length);
void JUN_InteropWriteFile(const char *path, const void *data, size_t length);