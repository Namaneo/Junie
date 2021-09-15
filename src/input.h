#pragma once

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

JUN_Input *JUN_InputInitialize();
void JUN_InputSetBinding(JUN_Input *this, const char *joypad_key, char *keyboard_key);
void JUN_InputSetFrameMetrics(JUN_Input *this, float width, float height);
void JUN_InputSetWindowMetrics(JUN_Input *this, float width, float height);
void JUN_InputSetMetrics(JUN_Input *this, JUN_TextureData *texture);
JUN_TextureData *JUN_InputGetMetrics(JUN_Input *this, JUN_TextureType type);
void JUN_InputSetStatus(JUN_Input *this, const MTY_Event *event);
int16_t JUN_InputGetStatus(JUN_Input *this, uint32_t device, uint32_t retro_key);
void JUN_InputDestroy(JUN_Input **input);

//TODO: Should go into a dedicated menu module
bool JUN_InputHasAudio(JUN_Input *this);
bool JUN_InputHasJoypad(JUN_Input *this);
bool JUN_InputShouldSaveState(JUN_Input *this);
void JUN_InputSetStateSaved(JUN_Input *this);
bool JUN_InputShouldRestoreState(JUN_Input *this);
void JUN_InputSetStateRestored(JUN_Input *this);
