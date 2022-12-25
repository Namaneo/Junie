#pragma once

#include "matoya.h"

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

JUN_App *JUN_AppCreate();
void JUN_AppDestroy(JUN_App **app);
