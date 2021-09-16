#pragma once

#include <stdbool.h>

typedef struct JUN_State JUN_State;

//TODO: might contain common video and input data
struct JUN_State
{
    bool     has_gamepad;
    bool     has_audio;
    bool     should_save_state;
    bool     should_restore_state;
    unsigned fast_forward;
};

typedef void (*JUN_StateCallback)(JUN_State *this);

JUN_State *JUN_StateInitialize();
void JUN_StateDestroy(JUN_State **this);
