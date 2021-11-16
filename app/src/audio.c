#include "audio.h"

struct JUN_Audio
{
    MTY_Audio *instance;
};

#define TARGET_FPS 60.0

JUN_Audio *JUN_AudioInitialize()
{
    JUN_Audio *this = MTY_Alloc(1, sizeof(JUN_Audio));

    return this;
}

void JUN_AudioPrepare(JUN_Audio *this, double sample_rate, double frames_per_second)
{
    //TODO: adjust sample rate based on the fast forward value
    double custom_rate = (sample_rate / frames_per_second) * TARGET_FPS;
    
    this->instance = MTY_AudioCreate(custom_rate, 75, 150);
}

void JUN_AudioQueue(JUN_Audio *this, const int16_t *data, size_t frames)
{
    MTY_AudioQueue(this->instance, data, frames);
}

void JUN_AudioDestroy(JUN_Audio **this)
{
    MTY_AudioDestroy(&(*this)->instance);

    MTY_Free(*this);
    *this = NULL;
}
