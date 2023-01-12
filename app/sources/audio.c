#include <stdio.h>
#include <string.h>
#include <SDL2/SDL.h>

#include "state.h"

#include "audio.h"

struct JUN_Audio
{
	double sample_rate;
	uint8_t fast_forward;
	SDL_AudioDeviceID device;
	SDL_AudioStream *stream;
};

JUN_Audio *JUN_AudioCreate()
{
	JUN_Audio *this = calloc(1, sizeof(JUN_Audio));

	SDL_InitSubSystem(SDL_INIT_AUDIO);

	return this;
}

void JUN_AudioSetSampleRate(JUN_Audio *this, double sample_rate, uint8_t fast_forward)
{
	if (this->sample_rate == sample_rate && this->fast_forward == fast_forward)
		return;

	if (!this->device) {
		SDL_AudioSpec desired = {0};
		SDL_AudioSpec obtained = {0};

		desired.format = AUDIO_S16LSB;
		desired.channels = 2;
		desired.freq = sample_rate;
		desired.samples = sample_rate / 100;

		this->device = SDL_OpenAudioDevice(NULL, 0, &desired, &obtained, 0);
		SDL_PauseAudioDevice(this->device, false);
	}

	if (this->stream) {
		SDL_ClearQueuedAudio(this->device);
		SDL_FreeAudioStream(this->stream);
	}

	this->stream = SDL_NewAudioStream(AUDIO_S16LSB, 2, sample_rate * fast_forward, AUDIO_S16LSB, 2, sample_rate);

	this->sample_rate = sample_rate;
	this->fast_forward = fast_forward;
}

void JUN_AudioQueue(JUN_Audio *this, const int16_t *data, size_t frames)
{
	SDL_AudioStreamPut(this->stream, data, frames * sizeof(int16_t) * 2);
	SDL_AudioStreamFlush(this->stream);

	int32_t length = SDL_AudioStreamAvailable(this->stream);

	if (length > 0) {
		char bytes[length];
		length = SDL_AudioStreamGet(this->stream, bytes, length);

		if (length > 0)
			SDL_QueueAudio(this->device, bytes, length);
	}
}

void JUN_AudioDestroy(JUN_Audio **audio)
{
	if (!audio || !*audio)
		return;

	JUN_Audio *this = *audio;

	if (this->stream)
		SDL_FreeAudioStream(this->stream);

	if (this->device)
		SDL_CloseAudioDevice(this->device);

	SDL_QuitSubSystem(SDL_INIT_AUDIO);

	free(this);
	*audio = NULL;
}
