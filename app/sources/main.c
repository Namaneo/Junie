#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <SDL2/SDL.h>

#include "matoya.h"
#include "filesystem.h"
#include "interop.h"

#include "app.h"

static bool environment(unsigned cmd, void *data, void *opaque)
{
	JUN_App *app = opaque;

	return JUN_CoreEnvironment(cmd, data);
}

static void video_refresh(const void *data, unsigned width, unsigned height, size_t pitch, void *opaque)
{
	JUN_App *app = opaque;

	JUN_VideoClear(app->video);

	enum retro_pixel_format format = JUN_CoreGetFormat();
	JUN_VideoUpdateContext(app->video, format, width, height, pitch);

	JUN_VideoDrawFrame(app->video, data);
	JUN_VideoDrawUI(app->video);
}

static void audio_sample(int16_t left, int16_t right, void *opaque)
{
	JUN_App *app = opaque;

	if (JUN_StateHasAudio(app->state))
		JUN_AudioQueue(app->audio, (int16_t[]) { left, right }, 1);
}

static size_t audio_sample_batch(const int16_t *data, size_t frames, void *opaque)
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

static int16_t input_state(unsigned port, unsigned device, unsigned index, unsigned id, void *opaque)
{
	JUN_App *app = opaque;

	if (port != 0)
		return 0;

	return JUN_InputGetStatus(app->input, id, device);
}

void main_loop(void *opaque)
{
	JUN_App *app = opaque;

	uint32_t fast_forward = JUN_StateGetFastForward(app->state);
	double sample_rate = JUN_CoreGetSampleRate() * fast_forward;

	JUN_AudioSetSampleRate(app->audio, sample_rate);
	JUN_CoreRun(fast_forward);
	JUN_VideoPresent(app->video);

	if (JUN_StateShouldExit(app->state)) {
		JUN_CoreDestroy();

		JUN_AppDestroy(&app);

		JUN_InteropCancelLoop();
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
	return MTY_JSONSerialize(JUN_CoreGetDefaultConfiguration(NULL));
}

void start_game(const char *system, const char *rom, const char *settings)
{
	JUN_App *app = JUN_AppCreate();

	JUN_CoreCreate(system, rom, settings, NULL);

	JUN_CoreSetCallbacks(& (JUN_CoreCallbacks) {
		.opaque             = app,
		.environment        = environment,
		.video_refresh      = video_refresh,
		.audio_sample       = audio_sample,
		.audio_sample_batch = audio_sample_batch,
		.input_poll         = input_poll,
		.input_state        = input_state,
	});

	if (!JUN_CoreStartGame()) {
		SDL_LogInfo(0, "Core for system '%s' failed to start rom '%s'", system, rom);
		return;
	}

	JUN_CoreRestoreMemories();
	JUN_CoreSetCheats();

	JUN_InteropStartLoop(main_loop, app);
}
