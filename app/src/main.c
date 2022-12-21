#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <emscripten.h>

#include "matoya.h"
#include "enums.h"
#include "filesystem.h"
#include "interop.h"
#include "debug.h"

#include "app.h"

#define PATH_SIZE 256

static struct {
	JUN_App *app;
} CTX;

static bool environment(unsigned cmd, void *data)
{
	return JUN_AppEnvironment(CTX.app, cmd, data);
}

static void video_refresh(const void *data, unsigned width, unsigned height, size_t pitch)
{
	JUN_VideoUpdateContext(CTX.app->video, width, height, pitch);

	JUN_VideoDrawFrame(CTX.app->video, data);
	JUN_VideoDrawUI(CTX.app->video, JUN_StateHasGamepad(CTX.app->state));
}

static void input_poll()
{
	// TODO Store input snapshot
}

static int16_t input_state(unsigned port, unsigned device, unsigned index, unsigned id)
{
	if (port != 0)
		return 0;

	return JUN_InputGetStatus(CTX.app->input, id, device);
}

static size_t audio_sample_batch(const int16_t *data, size_t frames)
{
	if (JUN_StateHasAudio(CTX.app->state))
		JUN_AudioQueue(CTX.app->audio, data, frames);

	return frames;
}

static void audio_sample(int16_t left, int16_t right)
{
	int16_t buf[2] = {left, right};
	audio_sample_batch(buf, 1);
}

void app_func()
{
	if (!JUN_VideoAssetsReady(CTX.app->video) || !JUN_CoreHasStarted())
		return;

	uint32_t factor = JUN_VideoComputeFramerate(CTX.app->video);
	JUN_CoreRun(JUN_StateGetFastForward(CTX.app->state) * factor);
	JUN_VideoPresent(CTX.app->video);

	if (JUN_StateShouldExit(CTX.app->state)) {
		emscripten_cancel_main_loop();

		// TODO Useless in emscripten

		// JUN_AppUnloadCore(CTX.app);
		// JUN_InputReset(CTX.app->input);
		// if (JUN_StateHasAudio(CTX.app->state))
		// 	JUN_StateToggleAudio(CTX.app->state);
		// JUN_FilesystemClearAllFiles();

		// JUN_AppDestroy(&CTX.app);
		// JUN_FilesystemDestroy();
		// JUN_EnumsDestroy();

		JUN_InteropShowUI(true);
		return;
	}

	JUN_CoreSaveMemories();

	if (JUN_StateShouldSaveState(CTX.app->state)) {
		JUN_CoreSaveState();
		JUN_StateToggleSaveState(CTX.app->state);
	}

	if (JUN_StateShouldRestoreState(CTX.app->state)) {
		JUN_CoreRestoreState();
		JUN_StateToggleRestoreState(CTX.app->state);
	}
}

static bool prepare_game(const char *system, const char *rom, const char *settings)
{
	char *path = NULL;
	size_t length = 0;

	JUN_AppLoadCore(CTX.app, system, rom, settings);

	JUN_CoreSetCallbacks(& (JUN_CoreCallbacks) {
		environment,
		video_refresh,
		audio_sample,
		audio_sample_batch,
		input_poll,
		input_state,
	});

	if (!JUN_CoreStartGame())
		return false;

	double sample_rate = JUN_CoreGetSampleRate();
	double frames_per_second = JUN_CoreGetFramesPerSecond();

	JUN_AudioPrepare(CTX.app->audio, sample_rate, frames_per_second);

	JUN_CoreRestoreMemories();
	JUN_CoreSetCheats();

	return true;
}

static void event_func(const MTY_Event *event, void *opaque)
{
	if (!CTX.app)
		return;

	JUN_InputSetStatus(CTX.app->input, event);

	JUN_PrintEvent(event);

	if (event->type == MTY_EVENT_CLOSE)
		JUN_StateToggleExit(CTX.app->state);
}

void start_game(const char *system, const char *rom, const char *settings)
{
	JUN_SetLogFunc();
	JUN_EnumsCreate();
	JUN_FilesystemCreate();

	JUN_InteropShowUI(false);

	CTX.app = JUN_AppCreate(event_func);
	JUN_VideoStart(CTX.app->video);

	if (!prepare_game(system, rom, settings)) {
		MTY_Log("Core for system '%s' failed to start rom '%s'", system, rom);
		JUN_InteropShowUI(true);
		return;
	}

	emscripten_set_main_loop(app_func, 0, 0);
}
