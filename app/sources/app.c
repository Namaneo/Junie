#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <SDL/SDL.h>

#include "filesystem.h"

#include "app.h"

static void log_func(void *userdata, int category, SDL_LogPriority priority, const char *message)
{
	if (message[strlen(message) - 1] != '\n')
		printf("%s\n", message);
	else
		printf("%s", message);
}

JUN_App *JUN_AppCreate()
{
	JUN_App *this = calloc(1, sizeof(JUN_App));

	SDL_LogSetOutputFunction(log_func, NULL);

#if !defined(DEBUG)
	SDL_LogSetAllPriority(SDL_LOG_PRIORITY_CRITICAL);
#endif

	this->audio = JUN_AudioCreate();
	this->state = JUN_StateCreate();
	this->input = JUN_InputCreate(this->state);
	this->video = JUN_VideoCreate(this->state, this->input);

	return (JUN_App *) this;
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

	free(this);
	*app = NULL;
}
