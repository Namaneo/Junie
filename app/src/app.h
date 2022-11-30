#pragma once

#include "matoya.h"

#include "core.h"
#include "state.h"
#include "input.h"
#include "audio.h"
#include "video.h"

typedef struct {
	JUN_Core *core;
	JUN_State *state;
	JUN_Input *input;
	JUN_Audio *audio;
	JUN_Video *video;
	MTY_App *mty;
} JUN_App;

JUN_App *JUN_AppCreate(MTY_AppFunc app_func, MTY_EventFunc event_func);
void JUN_AppLoadCore(JUN_App *public, const char *system, const char *rom, const MTY_JSON *settings);
const char *JUN_AppGetPath(JUN_App *public, JUN_PathType type);
void JUN_AppUnloadCore(JUN_App *public);
bool JUN_AppEnvironment(JUN_App *app, unsigned cmd, void *data);
void JUN_AppDestroy(JUN_App **app);
