#include <stdio.h>

#include "filesystem.h"
#include "interop.h"
#include "debug.h"

#include "app.h"

static void event_func(const MTY_Event *event, void *opaque)
{
	JUN_App *app = opaque;

	JUN_InputSetStatus(app->input, event);

	JUN_PrintEvent(event);

	if (event->type == MTY_EVENT_CLOSE)
		JUN_StateToggleExit(app->state);
}

JUN_App *JUN_AppCreate(const char *system, const char *rom, const char *settings)
{
	JUN_App *this = MTY_Alloc(1, sizeof(JUN_App));

	JUN_SetLogFunc();

	this->state = JUN_StateCreate();
	this->audio = JUN_AudioCreate();
	this->input = JUN_InputCreate(this->state);
	this->video = JUN_VideoCreate(this->state, this->input, event_func, this);

	JUN_CoreCreate(system, rom, settings, NULL);

	return (JUN_App *) this;
}

void JUN_AppDestroy(JUN_App **app)
{
	if (!app || !*app)
		return;

	JUN_App *this = *app;

	JUN_CoreDestroy();

	JUN_VideoDestroy(&this->video);
	JUN_AudioDestroy(&this->audio);
	JUN_InputDestroy(&this->input);
	JUN_StateDestroy(&this->state);

	MTY_Free(this);
	*app = NULL;
}
