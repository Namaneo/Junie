#include <string.h>

#include "state.h"

#include "audio.h"

struct JUN_Audio
{
	MTY_Audio *instance;
	JUN_State *state;
	uint8_t last_ff;
	double sample_rate;
};

#define TARGET_FPS 60.0

JUN_Audio *JUN_AudioCreate(JUN_State *state)
{
	JUN_Audio *this = MTY_Alloc(1, sizeof(JUN_Audio));

	this->state = state;

	return this;
}

void JUN_AudioPrepare(JUN_Audio *this, double sample_rate, double frames_per_second)
{
	this->sample_rate = (sample_rate / frames_per_second) * TARGET_FPS;
}

void JUN_AudioQueue(JUN_Audio *this, const int16_t *data, size_t frames)
{
	uint8_t ff = JUN_StateGetFastForward(this->state) + 1;

	if (ff != this->last_ff) {
		if (this->instance)
			MTY_AudioDestroy(&this->instance);
		this->instance = MTY_AudioCreate(this->sample_rate * ff, 75, 150);
	}

	this->last_ff = ff;

	MTY_AudioQueue(this->instance, data, frames);
}

void JUN_AudioDestroy(JUN_Audio **audio)
{
	if (!audio || !*audio)
		return;

	JUN_Audio *this = *audio;

	MTY_AudioDestroy(&this->instance);

	MTY_Free(this);
	*audio = NULL;
}
