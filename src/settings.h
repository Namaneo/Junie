#pragma once

#include "matoya.h"

typedef struct JUN_Settings JUN_Settings;

struct JUN_Settings
{
    struct {
        MTY_JSON *root;
        const MTY_JSON *core;
    } json;

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

JUN_Settings *JUN_SettingsInitialize(char *buffer, char *core);
void JUN_SettingsDestroy(JUN_Settings **context);