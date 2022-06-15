#include <string.h>

#include "state.h"

#include "audio.h"

struct JUN_Audio
{
	MTY_Audio *instance;
	JUN_State *state;
	int16_t *buffer;
	size_t size;
	uint8_t iteration;
	uint8_t last_ff;
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
	double custom_rate = (sample_rate / frames_per_second) * TARGET_FPS;

	this->instance = MTY_AudioCreate(custom_rate, 75, 150);
}

void JUN_AudioQueue(JUN_Audio *this, const int16_t *data, size_t frames)
{
	uint8_t ff = JUN_StateGetFastForward(this->state) + 1;

	if (ff != this->last_ff) {
		if (this->buffer)
			MTY_Free(this->buffer);
		this->buffer = NULL;
		this->size = 0;
		this->iteration = 0;
	}

	this->last_ff = ff;
	this->iteration++;

	size_t size = frames * 2;

	this->buffer = MTY_Realloc(this->buffer, this->size + size, sizeof(int16_t));
	memcpy(&this->buffer[this->size], data, size * sizeof(int16_t));
	this->size += size;

	if (this->iteration < this->last_ff)
		return;

	size_t accumulator = 0;
	int16_t *buffer = MTY_Alloc(size, sizeof(int16_t));
	for (size_t i = 0; i < this->size; i++) {
		accumulator += this->buffer[i];

		if (i % this->last_ff)
			continue;

		buffer[i / this->last_ff] = accumulator / this->last_ff;
		accumulator = 0;
	}

	MTY_AudioQueue(this->instance, buffer, frames);

	MTY_Free(buffer);
	MTY_Free(this->buffer);
	this->buffer = NULL;
	this->size = 0;
	this->iteration = 0;
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
