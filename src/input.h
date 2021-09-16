#pragma once

#include "state.h"
#include "texture.h"

typedef struct JUN_Input JUN_Input;

typedef enum JUN_TextureType JUN_TextureType;

enum JUN_TextureType
{
    CONTROLLER_MENU  = 0,
    CONTROLLER_LEFT  = 1,
    CONTROLLER_RIGHT = 2,
    LOADING_SCREEN   = 3,
    CONTROLLER_MAX   = 4,
};

typedef enum JUN_MenuType JUN_MenuType;

enum JUN_MenuType
{
    MENU_TOGGLE_GAMEPAD = 0,
    MENU_TOGGLE_AUDIO   = 1,
    MENU_SAVE_STATE     = 2,
    MENU_RESTORE_STATE  = 3,
    MENU_FAST_FORWARD   = 4,
    MENU_MAX            = 5,
};

JUN_Input *JUN_InputInitialize(JUN_State *state);
void JUN_InputSetBinding(JUN_Input *this, const char *joypad_key, char *keyboard_key);
void JUN_InputSetFrameMetrics(JUN_Input *this, float width, float height);
void JUN_InputSetWindowMetrics(JUN_Input *this, float width, float height);
void JUN_InputSetMetrics(JUN_Input *this, JUN_TextureData *texture);
JUN_TextureData *JUN_InputGetMetrics(JUN_Input *this, JUN_TextureType type);
void JUN_InputSetStatus(JUN_Input *this, const MTY_Event *event);
int16_t JUN_InputGetStatus(JUN_Input *this, uint32_t device, uint32_t retro_key);
void JUN_InputDestroy(JUN_Input **input);
