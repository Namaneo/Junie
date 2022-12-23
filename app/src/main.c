#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <emscripten.h>

#include "matoya.h"
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
	return JUN_CoreEnvironment(cmd, data);
}

static void video_refresh(const void *data, unsigned width, unsigned height, size_t pitch)
{
	enum retro_pixel_format format = JUN_CoreGetFormat();
	JUN_VideoUpdateContext(CTX.app->video, format, width, height, pitch);

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
	if (!JUN_CoreHasStarted())
		return;

	double frames_per_second = JUN_CoreGetFramesPerSecond();
	uint32_t factor = JUN_VideoComputeFramerate(CTX.app->video, frames_per_second);
	JUN_CoreRun(JUN_StateGetFastForward(CTX.app->state) * factor);
	JUN_VideoPresent(CTX.app->video);

	if (JUN_StateShouldExit(CTX.app->state)) {
		JUN_AppDestroy(&CTX.app);

		emscripten_cancel_main_loop();
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

static void event_func(const MTY_Event *event, void *opaque)
{
	if (!CTX.app)
		return;

	JUN_InputSetStatus(CTX.app->input, event);

	JUN_PrintEvent(event);

	if (event->type == MTY_EVENT_CLOSE)
		JUN_StateToggleExit(CTX.app->state);
}

static bool prepare_game(const char *system, const char *rom, const char *settings)
{
	CTX.app = JUN_AppCreate(event_func, system, rom, settings);

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

	JUN_AudioSetSampleRate(CTX.app->audio, JUN_CoreGetSampleRate());

	JUN_CoreRestoreMemories();
	JUN_CoreSetCheats();

	return true;
}

char *get_settings()
{
	return MTY_JSONSerialize(JUN_CoreGetDefaultConfiguration());
}

void start_game(const char *system, const char *rom, const char *settings)
{
	if (!prepare_game(system, rom, settings)) {
		MTY_Log("Core for system '%s' failed to start rom '%s'", system, rom);
		return;
	}

	JUN_InteropShowUI(false);
	emscripten_set_main_loop(app_func, 0, 0);
}
