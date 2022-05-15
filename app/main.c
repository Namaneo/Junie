#include <stdlib.h>
#include <stdio.h>
#include <string.h>

#include "enums.h"
#include "filesystem.h"
#include "interop.h"

#include "app.h"

JUN_App *app;

static bool environment(unsigned cmd, void *data)
{
	return JUN_AppEnvironment(app, cmd, data);
}

static void video_refresh(const void *data, unsigned width, unsigned height, size_t pitch)
{
	JUN_VideoUpdateContext(app->video, width, height, pitch);

	JUN_VideoDrawFrame(app->video, data);
	JUN_VideoDrawUI(app->video, JUN_StateHasGamepad(app->state));
}

static void input_poll()
{
}

static int16_t input_state(unsigned port, unsigned device, unsigned index, unsigned id)
{
	if (port != 0)
		return 0;

	return JUN_InputGetStatus(app->input, device, id);
}

static size_t audio_sample_batch(const int16_t *data, size_t frames)
{
	if (JUN_StateHasAudio(app->state))
		JUN_AudioQueue(app->audio, data, frames);

	return frames;
}

static void audio_sample(int16_t left, int16_t right)
{
	int16_t buf[2] = {left, right};
	audio_sample_batch(buf, 1);
}

static bool start_game()
{
	JUN_CoreSetCallbacks(app->core, &(JUN_CoreCallbacks)
	{
		environment,
		video_refresh,
		audio_sample,
		audio_sample_batch,
		input_poll,
		input_state,
	});

	if (!JUN_CoreStartGame(app->core))
		return false;

	double sample_rate = JUN_CoreGetSampleRate(app->core);
	double frames_per_second = JUN_CoreGetFramesPerSecond(app->core);

	JUN_AudioPrepare(app->audio, sample_rate, frames_per_second);

	JUN_CoreRestoreMemories(app->core);

	JUN_CoreSetCheats(app->core);

	return true;
}

static bool app_func(void *opaque)
{
	// TODO useless for now
	// JUN_VideoDrawLoadingScreen(app->video);

	for (int i = 0; i < JUN_StateGetFastForward(app->state); ++i)
		JUN_CoreRun(app->core);

	JUN_CoreRun(app->core);

	JUN_CoreSaveMemories(app->core);

	if (JUN_StateShouldSaveState(app->state)) {
		JUN_CoreSaveState(app->core);
		JUN_StateToggleSaveState(app->state);
	}

	if (JUN_StateShouldRestoreState(app->state)) {
		JUN_CoreRestoreState(app->core);
		JUN_StateToggleRestoreState(app->state);
	}

	JUN_VideoPresent(app->video);

	return !JUN_StateShouldExit(app->state);
}

static void event_func(const MTY_Event *event, void *opaque)
{
	JUN_InputSetStatus(app->input, event);

	if (event->type == MTY_EVENT_CLOSE)
		JUN_StateExit(app->state);
}

static void log_func(const char *message, void *opaque)
{
	if (message[strlen(message) - 1] != '\n')
		printf("%s\n", message);
	else
		printf("%s", message);
}

int main(int argc, char *argv[])
{
	MTY_SetLogFunc(log_func, NULL);

	JUN_EnumsInitialize();
	JUN_FilesystemInitialize();
	app = JUN_AppInitialize(app_func, event_func);

	start_game();
	JUN_VideoStart(app->video);

	JUN_AppDestroy(&app);
	JUN_FilesystemDestroy();
	JUN_EnumsDestroy();

	return 0;
}
