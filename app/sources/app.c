#include <stdio.h>
#include <stdlib.h>
#include <SDL2/SDL.h>

#include "filesystem.h"
#include "interop.h"

#include "app.h"

static void log_func(void *userdata, int category, SDL_LogPriority priority, const char *message)
{
	if (message[strlen(message) - 1] != '\n')
		printf("%s\n", message);
	else
		printf("%s", message);
}

JUN_App *JUN_AppCreate(JUN_InteropLoopFunc loop)
{
	JUN_App *this = calloc(1, sizeof(JUN_App));

	SDL_LogSetOutputFunction(log_func, NULL);

#if !defined(DEBUG)
	SDL_LogSetAllPriority(SDL_LOG_PRIORITY_CRITICAL);
#endif

	JUN_InteropStartLoop(loop, this);

	this->audio = JUN_AudioCreate();
	this->state = JUN_StateCreate();
	this->input = JUN_InputCreate(this->state);
	this->video = JUN_VideoCreate(this->state, this->input);

	return (JUN_App *) this;
}

bool JUN_AppReady(JUN_App *this)
{
	return this->audio && this->state && this->input && this->video;
}

void JUN_AppDestroy(JUN_App **app)
{
	if (!app || !*app)
		return;

	JUN_App *this = *app;

	JUN_VideoDestroy(&this->video);
	JUN_InputDestroy(&this->input);
	JUN_StateDestroy(&this->state);
	JUN_AudioDestroy(&this->audio);

	JUN_InteropCancelLoop();

	free(this);
	*app = NULL;
}
