#pragma once

#include "matoya.h"

typedef struct JUN_Settings JUN_Settings;

struct JUN_Settings
{
    const MTY_JSON *json;

    char *language;
    MTY_Hash *bindings;
    MTY_List *dependencies;
    MTY_Hash *configurations;
};

JUN_Settings *JUN_SettingsCreate(const MTY_JSON *json);
void JUN_SettingsDestroy(JUN_Settings **settings);
