#pragma once

#include "matoya.h"

typedef struct JUN_Enums JUN_Enums;

typedef enum JUN_EnumType JUN_EnumType;

enum JUN_EnumType
{
    JUN_ENUM_ENVIRONMENT,
    JUN_ENUM_LANGUAGE,
    JUN_ENUM_JOYPAD,
    JUN_ENUM_KEYBOARD,
};

void JUN_EnumsInitialize();
uint32_t JUN_EnumsGetInt(JUN_EnumType type, const char *key);
const char *JUN_EnumsGetString(JUN_EnumType type, uint32_t value);
void JUN_EnumsDestroy();