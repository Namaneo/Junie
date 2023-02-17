#include <stdlib.h>
#include <time.h>

#include "tools.h"

#include "framerate.h"

struct JUN_Framerate
{
	double framerate;
	double last_delay;
	double last_second;

	uint32_t frames_current;
	uint32_t frames_pending;
};

JUN_Framerate *JUN_FramerateCreate(double framerate)
{
	JUN_Framerate *this = calloc(1, sizeof(JUN_Framerate));

	this->framerate = 1000.0 / framerate;
	this->last_delay = JUN_GetTicks();
	this->last_second = this->last_delay;

	return this;
}

uint32_t JUN_FramerateGetFPS(JUN_Framerate *this)
{
	return this->frames_current;
}

void JUN_FramerateDelay(JUN_Framerate *this)
{
	double now = JUN_GetTicks();
	double delta = 0;

	while (delta < this->framerate) {
		now = JUN_GetTicks();
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
