#pragma once

#include "matoya.h"

typedef struct JUN_Settings JUN_Settings;

struct JUN_Settings
{
    const char *core_name;
    const MTY_JSON *json;

    char *language;

    struct
    {
        char *menu;
        char *left;
        char *right;
        char *loading;
    } assets;

    MTY_List *dependencies;
    MTY_Hash *configurations;
    MTY_Hash *bindings;
};

JUN_Settings *JUN_SettingsCreate(const char *core_name, const MTY_JSON *json);
void JUN_SettingsDestroy(JUN_Settings **settings);
