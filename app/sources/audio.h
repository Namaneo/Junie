#pragma once

typedef struct JUN_Audio JUN_Audio;

JUN_Audio *JUN_AudioCreate();
void JUN_AudioSetSampleRate(JUN_Audio *this, double sample_rate, uint8_t fast_forward);
void JUN_AudioQueue(JUN_Audio *this, const int16_t *data, size_t frames);
void JUN_AudioFlush(JUN_Audio *this);
void JUN_AudioDestroy(JUN_Audio **audio);
