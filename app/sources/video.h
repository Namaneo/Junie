#pragma once

#include "input.h"

typedef struct JUN_Video JUN_Video;

JUN_Video *JUN_VideoCreate(JUN_State *state, JUN_Input *input);
void JUN_VideoPrepareAssets(JUN_Video *this);
void JUN_VideoClear(JUN_Video *this);
void JUN_VideoUpdateContext(JUN_Video *this, unsigned width, unsigned height);
void JUN_VideoDrawFrame(JUN_Video *this, const void *data);
void JUN_VideoDrawUI(JUN_Video *this);
void JUN_VideoPresent(JUN_Video *this);
void JUN_VideoDestroy(JUN_Video **video);
