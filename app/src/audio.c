#include <string.h>
#include <AL/al.h>
#include <AL/alc.h>

#include "state.h"

#include "audio.h"

struct JUN_Audio
{
	JUN_State *state;
	uint8_t last_ff;
	double sample_rate;

	ALCdevice *device;
	ALCcontext *context;
	uint32_t source;
};

JUN_Audio *JUN_AudioCreate(JUN_State *state)
{
	JUN_Audio *this = MTY_Alloc(1, sizeof(JUN_Audio));

	this->state = state;

	this->device = alcOpenDevice(NULL);
	this->context = alcCreateContext(this->device, NULL);
	alcMakeContextCurrent(this->context);

	alGenSources(1, &this->source);

	return this;
}

void JUN_AudioSetSampleRate(JUN_Audio *this, double sample_rate)
{
	this->sample_rate = sample_rate;
}

static void jun_unqueue_buffers(JUN_Audio *this)
{
	int32_t processed_len = 0;
	alGetSourcei(this->source, AL_BUFFERS_PROCESSED, &processed_len);

	uint32_t processed[processed_len];
	alSourceUnqueueBuffers(this->source, processed_len, processed);

	if (processed_len)
		alDeleteBuffers(processed_len, processed);
}

void JUN_AudioQueue(JUN_Audio *this, const int16_t *data, size_t frames)
{
	jun_unqueue_buffers(this);

	int32_t queued_len = 0;
	alGetSourcei(this->source, AL_BUFFERS_QUEUED, &queued_len);

	if (queued_len < 5) {
		uint32_t buffer = 0;
		uint32_t data_size = sizeof(int16_t) * frames * 2;
		uint32_t sample_rate = this->sample_rate * JUN_StateGetFastForward(this->state);

		alGenBuffers(1, &buffer);
		alBufferData(buffer, AL_FORMAT_STEREO16, data, data_size, sample_rate);
		alSourceQueueBuffers(this->source, 1, &buffer);
	}

	int32_t state = 0;
	alGetSourcei(this->source, AL_SOURCE_STATE, &state);
	if (state != AL_PLAYING)
		alSourcePlay(this->source);
}

void JUN_AudioDestroy(JUN_Audio **audio)
{
	if (!audio || !*audio)
		return;

	JUN_Audio *this = *audio;

	alDeleteSources(1, &this->source);

	jun_unqueue_buffers(this);

	alcMakeContextCurrent(NULL);
	alcDestroyContext(this->context);
	alcCloseDevice(this->device);

	MTY_Free(this);
	*audio = NULL;
}
