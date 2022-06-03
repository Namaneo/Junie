#pragma once

#include "matoya.h"

typedef struct JUN_Enums JUN_Enums;

typedef enum {
	JUN_ENUM_ENVIRONMENT,
	JUN_ENUM_LANGUAGE,
	JUN_ENUM_JOYPAD,
	JUN_ENUM_KEYBOARD,
} JUN_EnumType;

typedef enum {
	JUN_FILE_GAME     = 1,
	JUN_FILE_STATE    = 2,
	JUN_FILE_SRAM     = 3,
	JUN_FILE_RTC      = 4,
	JUN_FOLDER_SAVES  = 5,
	JUN_FOLDER_SYSTEM = 6,
	JUN_FOLDER_CHEATS = 7,
	JUN_PATH_MAKE_64  = UINT64_MAX
} JUN_PathType;

void JUN_EnumsCreate();
MTY_JSON *JUN_EnumsGetAll(JUN_EnumType type);
uint32_t JUN_EnumsGetInt(JUN_EnumType type, const char *key);
const char *JUN_EnumsGetString(JUN_EnumType type, uint32_t value);
void JUN_EnumsDestroy();
