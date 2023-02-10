#include <stdlib.h>
#include <SDL2/SDL.h>

#include "framerate.h"

struct JUN_Framerate
{
	double framerate;
	double frequency;

	double last_delay;
	double last_second;

	uint32_t frames_current;
	uint32_t frames_pending;
};

static double get_timestamp(JUN_Framerate *this)
{
	return (SDL_GetPerformanceCounter() * 1000.0) / SDL_GetPerformanceFrequency();
}

JUN_Framerate *JUN_FramerateCreate(double framerate)
{
	JUN_Framerate *this = calloc(1, sizeof(JUN_Framerate));

	this->framerate = 1000.0 / framerate;
	this->frequency = SDL_GetPerformanceFrequency();
	this->last_delay = get_timestamp(this);
	this->last_second = this->last_delay;

	return this;
}

uint32_t JUN_FramerateGetFPS(JUN_Framerate *this)
{
	return this->frames_current;
}

void JUN_FramerateDelay(JUN_Framerate *this)
{
	double now = get_timestamp(this);
	double delta = 0;

	while (delta < this->framerate) {
		now = get_timestamp(this);
		delta = now - this->last_delay;
	}

	this->last_delay = now;

	this->frames_pending++;
	if (now - this->last_second > 1000.0) {
		this->last_second = now;
		this->frames_current = this->frames_pending;
		this->frames_pending = 0;
	}
}

void JUN_FramerateDestroy(JUN_Framerate **framerate)
{
	if (!framerate || !*framerate)
		return;

	JUN_Framerate *this = *framerate;

	free(this);
	*framerate = NULL;
}
