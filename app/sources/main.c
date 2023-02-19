#include <stdlib.h>
#include <stdio.h>
#include <string.h>

#include "tools.h"

#include "app.h"

#if !defined(__EMSCRIPTEN__)
#define run_game(app) while (!JUN_StateShouldExit(app->state) && run_iteration(app))
#define stop_game()
#else
#include <emscripten.h>
#define run_game(app) emscripten_set_main_loop_arg((em_arg_callback_func) run_iteration, app, 1000, 1)
#define stop_game()   emscripten_cancel_main_loop()
#endif

static bool environment(uint32_t cmd, void *data, void *opaque)
{
	JUN_App *app = opaque;

	return JUN_CoreEnvironment(cmd, data);
}

static void video_refresh(const void *data, uint32_t width, uint32_t height, void *opaque)
{
	JUN_App *app = opaque;

	JUN_VideoUpdateContext(app->video, width, height);

	JUN_VideoClear(app->video);
	JUN_VideoDrawFrame(app->video, data);
	JUN_VideoDrawUI(app->video);
	JUN_VideoPresent(app->video);
}

static size_t audio_sample(const int16_t *data, size_t frames, void *opaque)
{
	JUN_App *app = opaque;

	if (JUN_StateHasAudio(app->state))
		JUN_AudioQueue(app->audio, data, frames);

	return frames;
}

static void input_poll(void *opaque)
{
	JUN_App *app = opaque;

	JUN_InputPollEvents(app->input);
}

static int16_t input_state(uint32_t port, uint32_t device, uint32_t index, uint32_t id, void *opaque)
{
	JUN_App *app = opaque;

	if (port != 0)
		return 0;

	return JUN_InputGetStatus(app->input, id, device);
}

static bool run_iteration(void *opaque)
{
	JUN_App *app = opaque;

	uint8_t fast_forward = JUN_StateGetFastForward(app->state);

	JUN_AudioUpdate(app->audio, fast_forward);
	JUN_CoreRun(fast_forward);

	if (JUN_StateShouldSaveState(app->state)) {
		JUN_CoreSaveState();
		JUN_StateToggleSaveState(app->state);
	}

	if (JUN_StateShouldRestoreState(app->state)) {
		JUN_CoreRestoreState();
		JUN_StateToggleRestoreState(app->state);
	}

	if (JUN_StateShouldExit(app->state)) {
		stop_game();
		return false;
	}

	return true;
}

char *get_settings()
{
	return JUN_CoreGetDefaultConfiguration(NULL);
}

int main(int argc, const char *argv[])
{
	const char *system = argv[1];
	const char *rom = argv[2];
	const char *settings = argv[3];

	JUN_App *app = JUN_AppCreate();

	JUN_CoreCreate(system, rom, settings, NULL);

	JUN_CoreSetCallbacks(& (JUN_CoreCallbacks) {
		.opaque             = app,
		.environment        = environment,
		.video_refresh      = video_refresh,
		.audio_sample       = audio_sample,
		.input_poll         = input_poll,
		.input_state        = input_state,
	});

	if (!JUN_CoreStartGame()) {
		JUN_Log("Core for system '%s' failed to start rom '%s'", system, rom);
		return 1;
	}

	double sample_rate = JUN_CoreGetSampleRate();
	double frames_per_second = JUN_CoreGetFramesPerSecond();
	JUN_AudioOpen(app->audio, sample_rate, frames_per_second);

	run_game(app);

	JUN_CoreDestroy();
	JUN_AppDestroy(&app);

	return 0;
}
