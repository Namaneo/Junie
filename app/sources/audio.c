#include <stdio.h>
#include <string.h>
#include <math.h>
#include <SDL2/SDL.h>

#include "state.h"

#include "audio.h"

struct JUN_Audio
{
	double sample_rate;
	double frames_per_second;
	uint8_t fast_forward;

	int16_t last_left;
	int16_t last_right;

	SDL_AudioDeviceID device;
	SDL_AudioStream *stream;
};

JUN_Audio *JUN_AudioCreate()
{
	JUN_Audio *this = calloc(1, sizeof(JUN_Audio));

	SDL_InitSubSystem(SDL_INIT_AUDIO);

	return this;
}

void audio_callback(void *opaque, int16_t *stream, uint32_t length)
{
	JUN_Audio *this = opaque;

	memset(stream, 0, length);

	int32_t available = SDL_AudioStreamGet(this->stream, stream, length);

	if (available >= sizeof(int16_t) * 2) {
		this->last_left  = stream[available - 2];
		this->last_right = stream[available - 1];
	}

	if (available == 0 || available >= length)
		return;

	for (size_t i = available; i < length; i += sizeof(int16_t) * 2) {
		stream[i + 0] = this->last_left;
		stream[i + 1] = this->last_right;
	}
}

void JUN_AudioOpen(JUN_Audio *this, double sample_rate, double frames_per_second)
{
	this->sample_rate = sample_rate;
	this->frames_per_second = frames_per_second;

	SDL_AudioSpec desired = {0};
	SDL_AudioSpec obtained = {0};

	desired.format = AUDIO_S16LSB;
	desired.freq = this->sample_rate;
	desired.channels = 2;
	desired.samples = this->sample_rate / this->frames_per_second;
	desired.callback = (SDL_AudioCallback) audio_callback;
	desired.userdata = this;

	this->device = SDL_OpenAudioDevice(NULL, 0, &desired, &obtained, 0);
	SDL_PauseAudioDevice(this->device, false);
}

void JUN_AudioUpdate(JUN_Audio *this, uint8_t fast_forward)
{
	if (this->fast_forward == fast_forward)
		return;

	this->fast_forward = fast_forward;

	if (this->stream) {
		SDL_ClearQueuedAudio(this->device);
		SDL_FreeAudioStream(this->stream);
		this->stream = NULL;
	}

	this->stream = SDL_NewAudioStream(
		AUDIO_S16LSB, 2, this->sample_rate * this->fast_forward,
		AUDIO_S16LSB, 2, this->sample_rate
	);
}

void JUN_AudioQueue(JUN_Audio *this, const int16_t *data, size_t frames)
{
	SDL_AudioStreamPut(this->stream, data, frames * sizeof(int16_t) * 2);
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
