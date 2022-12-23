#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <emscripten.h>

#include "matoya.h"
#include "filesystem.h"
#include "interop.h"
#include "debug.h"

#include "app.h"


static JUN_App *app = NULL;

static bool environment(unsigned cmd, void *data)
{
	return JUN_CoreEnvironment(cmd, data);
}

static void video_refresh(const void *data, unsigned width, unsigned height, size_t pitch)
{
	enum retro_pixel_format format = JUN_CoreGetFormat();
	JUN_VideoUpdateContext(app->video, format, width, height, pitch);

	JUN_VideoDrawFrame(app->video, data);
	JUN_VideoDrawUI(app->video, JUN_StateHasGamepad(app->state));
}

static void input_poll()
{
	// TODO Store input snapshot
}

static int16_t input_state(unsigned port, unsigned device, unsigned index, unsigned id)
{
	if (port != 0)
		return 0;

	return JUN_InputGetStatus(app->input, id, device);
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

void main_loop()
{
	double frames_per_second = JUN_CoreGetFramesPerSecond();
	uint32_t factor = JUN_VideoComputeFramerate(app->video, frames_per_second);
	JUN_CoreRun(JUN_StateGetFastForward(app->state) * factor);
	JUN_VideoPresent(app->video);

	if (JUN_StateShouldExit(app->state)) {
		JUN_AppDestroy(&app);

		emscripten_cancel_main_loop();
		JUN_InteropShowUI(true);
		return;
	}

	JUN_CoreSaveMemories();

	if (JUN_StateShouldSaveState(app->state)) {
		JUN_CoreSaveState();
		JUN_StateToggleSaveState(app->state);
	}

	if (JUN_StateShouldRestoreState(app->state)) {
		JUN_CoreRestoreState();
		JUN_StateToggleRestoreState(app->state);
	}
}

char *get_settings()
{
	return MTY_JSONSerialize(JUN_CoreGetDefaultConfiguration());
}

void start_game(const char *system, const char *rom, const char *settings)
{
	app = JUN_AppCreate(system, rom, settings);

	JUN_CoreSetCallbacks(& (JUN_CoreCallbacks) {
		environment,
		video_refresh,
		audio_sample,
		audio_sample_batch,
		input_poll,
		input_state,
	});

	if (!JUN_CoreStartGame()) {
		MTY_Log("Core for system '%s' failed to start rom '%s'", system, rom);
		return;
	}

	JUN_AudioSetSampleRate(app->audio, JUN_CoreGetSampleRate());

	JUN_CoreRestoreMemories();
	JUN_CoreSetCheats();

	JUN_InteropShowUI(false);
	emscripten_set_main_loop(main_loop, 0, 0);
}
