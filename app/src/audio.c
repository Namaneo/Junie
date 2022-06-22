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

static void jun_audio_recreate(JUN_Audio *this, bool force)
{
	uint8_t fast_forward = JUN_StateGetFastForward(this->state) + 1;

	if (fast_forward == this->last_ff && !force)
		return;

	this->last_ff = fast_forward;

	if (this->instance)
		MTY_AudioDestroy(&this->instance);

	this->instance = MTY_AudioCreate(this->sample_rate * fast_forward, 75, 150);
}

void JUN_AudioPrepare(JUN_Audio *this, double sample_rate, double frames_per_second)
{
	this->sample_rate = (sample_rate / frames_per_second) * TARGET_FPS;
	jun_audio_recreate(this, true);
}

void JUN_AudioQueue(JUN_Audio *this, const int16_t *data, size_t frames)
{
	jun_audio_recreate(this, false);

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
