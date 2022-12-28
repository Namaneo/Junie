#include <stdio.h>
#include <string.h>
#include <SDL2/SDL.h>

#include "state.h"

#include "audio.h"

struct JUN_Audio
{
	double sample_rate;
	SDL_AudioDeviceID device;
};

JUN_Audio *JUN_AudioCreate()
{
	JUN_Audio *this = MTY_Alloc(1, sizeof(JUN_Audio));

	SDL_InitSubSystem(SDL_INIT_AUDIO);

	return this;
}

void JUN_AudioSetSampleRate(JUN_Audio *this, double sample_rate)
{
	if (this->sample_rate == sample_rate)
		return;

	if (this->device)
		SDL_CloseAudioDevice(this->device);

	SDL_AudioSpec desired = {0};
	SDL_AudioSpec obtained = {0};

	desired.format = AUDIO_S16LSB;
	desired.channels = 2;
	desired.freq = sample_rate;
	desired.samples = 512;

	this->device = SDL_OpenAudioDevice(NULL, 0, &desired, &obtained, 0);
	SDL_PauseAudioDevice(this->device, false);

	this->sample_rate = sample_rate;
}

void JUN_AudioQueue(JUN_Audio *this, const int16_t *data, size_t frames)
{
	SDL_QueueAudio(this->device, data, frames * 2 * sizeof(int16_t));
}

void JUN_AudioDestroy(JUN_Audio **audio)
{
	if (!audio || !*audio)
		return;

	JUN_Audio *this = *audio;

	if (this->device)
		SDL_CloseAudioDevice(this->device);

	SDL_QuitSubSystem(SDL_INIT_AUDIO);

	MTY_Free(this);
	*audio = NULL;
}
