#include <stdio.h>
#include <string.h>
#include <SDL2/SDL.h>

#include "state.h"

#include "audio.h"

#define JUN_AUDIO_FORMAT    AUDIO_F32
#define JUN_AUDIO_FREQUENCY 48000
#define JUN_AUDIO_CHANNELS  2
#define JUN_AUDIO_SAMPLES   512

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

	SDL_AudioSpec desired = {0};
	SDL_AudioSpec obtained = {0};

	desired.format = JUN_AUDIO_FORMAT;
	desired.freq = JUN_AUDIO_FREQUENCY;
	desired.channels = JUN_AUDIO_CHANNELS;
	desired.samples = JUN_AUDIO_SAMPLES;

	this->device = SDL_OpenAudioDevice(NULL, 0, &desired, &obtained, 0);
	SDL_PauseAudioDevice(this->device, false);

	return this;
}

void JUN_AudioUpdate(JUN_Audio *this, double sample_rate, uint8_t fast_forward)
{
	if (this->sample_rate == sample_rate && this->fast_forward == fast_forward)
		return;

	if (this->stream) {
		SDL_ClearQueuedAudio(this->device);
		SDL_FreeAudioStream(this->stream);
	}

	this->stream = SDL_NewAudioStream(
		AUDIO_S16LSB, 2, sample_rate * fast_forward,
		JUN_AUDIO_FORMAT, JUN_AUDIO_CHANNELS, JUN_AUDIO_FREQUENCY
	);

	this->sample_rate = sample_rate;
	this->fast_forward = fast_forward;
}

void JUN_AudioQueue(JUN_Audio *this, const int16_t *data, size_t frames)
{
	SDL_AudioStreamPut(this->stream, data, frames * sizeof(int16_t) * 2);
}

void JUN_AudioFlush(JUN_Audio *this)
{
	int32_t length = SDL_AudioStreamAvailable(this->stream);
	if (length <= 0)
		return;

	char bytes[length];
	SDL_AudioStreamGet(this->stream, bytes, length);

	SDL_QueueAudio(this->device, bytes, length);
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
