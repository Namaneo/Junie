#pragma once

#include "core.h"
#include "state.h"
#include "input.h"
#include "audio.h"
#include "video.h"

typedef struct {
	JUN_State *state;
	JUN_Input *input;
	JUN_Audio *audio;
	JUN_Video *video;
} JUN_App;

JUN_App *JUN_AppCreate(JUN_InteropLoopFunc loop);
bool JUN_AppReady(JUN_App *this);
void JUN_AppDestroy(JUN_App **app);
