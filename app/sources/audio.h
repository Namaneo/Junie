#pragma once

#include "matoya.h"

typedef struct JUN_Audio JUN_Audio;

JUN_Audio *JUN_AudioCreate();
void JUN_AudioSetSampleRate(JUN_Audio *this, double sample_rate);
void JUN_AudioQueue(JUN_Audio *this, const int16_t *data, size_t frames);
void JUN_AudioDestroy(JUN_Audio **audio);
