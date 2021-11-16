#pragma once

#include "matoya.h"

#include "core.h"
#include "state.h"
#include "input.h"
#include "audio.h"
#include "video.h"

typedef struct JUN_App JUN_App;

struct JUN_App
{
    JUN_Core  *core;
    JUN_State *state;
    JUN_Input *input;
    JUN_Audio *audio;
    JUN_Video *video;

    bool quit;
};

JUN_App *JUN_AppInitialize(MTY_AppFunc app_func, MTY_EventFunc event_func);
void JUN_AppConfigure(JUN_App *app, char *json);
bool JUN_AppEnvironment(JUN_App *app, unsigned cmd, void *data);
void JUN_AppDestroy(JUN_App **app);
