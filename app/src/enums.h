#pragma once

#include "matoya.h"

typedef struct JUN_Enums JUN_Enums;

typedef enum {
	JUN_ENUM_ENVIRONMENT,
	JUN_ENUM_LANGUAGE,
} JUN_EnumType;

typedef enum {
	JUN_PATH_GAME   = 1,
	JUN_PATH_STATE  = 2,
	JUN_PATH_SRAM   = 3,
	JUN_PATH_RTC    = 4,
	JUN_PATH_CHEATS = 7,
	JUN_PATH_SAVES  = 5,
	JUN_PATH_SYSTEM = 6,
	JUN_PATH_MAKE64 = UINT64_MAX
} JUN_PathType;

void JUN_EnumsCreate();
MTY_JSON *JUN_EnumsGetAll(JUN_EnumType type);
uint32_t JUN_EnumsGetInt(JUN_EnumType type, const char *key);
const char *JUN_EnumsGetString(JUN_EnumType type, uint32_t value);
void JUN_EnumsDestroy();
