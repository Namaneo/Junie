#include <stdio.h>

#include "filesystem.h"
#include "interop.h"
#include "debug.h"

#include "app.h"

JUN_App *JUN_AppCreate()
{
	JUN_App *this = MTY_Alloc(1, sizeof(JUN_App));

	JUN_SetLogFunc();

	this->state = JUN_StateCreate();
	this->audio = JUN_AudioCreate();
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
	JUN_AudioDestroy(&this->audio);
	JUN_InputDestroy(&this->input);
	JUN_StateDestroy(&this->state);

	MTY_Free(this);
	*app = NULL;
}
