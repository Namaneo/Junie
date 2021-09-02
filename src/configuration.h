#pragma once

#include "matoya.h"

typedef struct JUN_Configuration JUN_Configuration;

JUN_Configuration *JUN_ConfigurationInitialize();
char *JUN_ConfigurationGet(JUN_Configuration *this, const char *key);
void JUN_ConfigurationSet(JUN_Configuration *this, const char *key, const char *value);
void JUN_ConfigurationOverride(JUN_Configuration *this, const char *key, const char *value);
void JUN_ConfigurationDestroy(JUN_Configuration **this);
