#pragma once

#include "matoya.h"

typedef struct JUN_Audio JUN_Audio;

JUN_Audio *JUN_AudioInitialize();
void JUN_AudioPrepare(JUN_Audio *this, double sample_rate, double frames_per_second);
void JUN_AudioQueue(JUN_Audio *this, const int16_t *data, size_t frames);
void JUN_AudioDestroy(JUN_Audio **this);
