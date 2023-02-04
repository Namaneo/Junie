#include <stdio.h>
#include <string.h>
#include <SDL2/SDL.h>

#include "state.h"
#include "buffer.h"

#include "audio.h"

#define JUN_AUDIO_FORMAT    AUDIO_F32
#define JUN_AUDIO_FREQUENCY 48000.0
#define JUN_AUDIO_CHANNELS  2.0
#define JUN_AUDIO_SAMPLES   512.0

struct JUN_Audio
{
	double sample_rate;
	uint8_t fast_forward;
	SDL_AudioDeviceID device;
	SDL_AudioStream *stream;
	JUN_Buffer *buffer;
};

void audio_callback(void *opaque, uint8_t *stream, int32_t length)
{
	JUN_Audio *this = opaque;

	int32_t available = SDL_AudioStreamAvailable(this->stream);
	if (available > 0) {
		void *data = calloc(available, 1);
		SDL_AudioStreamGet(this->stream, data, available);
		JUN_BufferWrite(this->buffer, data, available);
		free(data);
	}

	JUN_BufferRead(this->buffer, stream, length);
}

JUN_Audio *JUN_AudioCreate()
{
	JUN_Audio *this = calloc(1, sizeof(JUN_Audio));

	SDL_InitSubSystem(SDL_INIT_AUDIO);

	return this;
}

void JUN_AudioOpen(JUN_Audio *this, double sample_rate, double frames_per_second)
{
	this->sample_rate = sample_rate;

	SDL_AudioSpec desired = {0};
	SDL_AudioSpec obtained = {0};

	desired.format = JUN_AUDIO_FORMAT;
	desired.freq = JUN_AUDIO_FREQUENCY;
	desired.channels = JUN_AUDIO_CHANNELS;
	desired.samples = JUN_AUDIO_SAMPLES;
	desired.callback = audio_callback;
	desired.userdata = this;

	this->device = SDL_OpenAudioDevice(NULL, 0, &desired, &obtained, 0);
	SDL_PauseAudioDevice(this->device, false);

	uint32_t samples_per_frame = (sample_rate / frames_per_second) * 2;
	this->buffer = JUN_BufferCreate(samples_per_frame * sizeof(float) * 10);
}

void JUN_AudioUpdate(JUN_Audio *this, uint8_t fast_forward)
{
	if (this->fast_forward == fast_forward)
		return;

	this->fast_forward = fast_forward;

	if (this->stream) {
		SDL_ClearQueuedAudio(this->device);
		SDL_FreeAudioStream(this->stream);
	}

	this->stream = SDL_NewAudioStream(
		AUDIO_S16LSB, 2, this->sample_rate * this->fast_forward,
		JUN_AUDIO_FORMAT, JUN_AUDIO_CHANNELS, JUN_AUDIO_FREQUENCY
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

	JUN_BufferDestroy(&this->buffer);

	SDL_QuitSubSystem(SDL_INIT_AUDIO);

	free(this);
	*audio = NULL;
}
