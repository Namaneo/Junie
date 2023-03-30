#include "app.h"

#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <emscripten.h>

#include "libretro.h"

#include "tools.h"

static void update_inputs(JUN_App *app)
{
	JUN_InputPollEvents(app->input);

	#define SET_INPUT(device, id) JUN_CoreSetInput(device, id, JUN_InputGetStatus(app->input, device, id))

	SET_INPUT(RETRO_DEVICE_POINTER, RETRO_DEVICE_ID_POINTER_PRESSED);
	SET_INPUT(RETRO_DEVICE_POINTER, RETRO_DEVICE_ID_POINTER_X);
	SET_INPUT(RETRO_DEVICE_POINTER, RETRO_DEVICE_ID_POINTER_Y);

	if (JUN_StateHasGamepad(app->state)) {
		SET_INPUT(RETRO_DEVICE_JOYPAD, RETRO_DEVICE_ID_JOYPAD_UP);
		SET_INPUT(RETRO_DEVICE_JOYPAD, RETRO_DEVICE_ID_JOYPAD_UP);
		SET_INPUT(RETRO_DEVICE_JOYPAD, RETRO_DEVICE_ID_JOYPAD_DOWN);
		SET_INPUT(RETRO_DEVICE_JOYPAD, RETRO_DEVICE_ID_JOYPAD_LEFT);
		SET_INPUT(RETRO_DEVICE_JOYPAD, RETRO_DEVICE_ID_JOYPAD_RIGHT);
		SET_INPUT(RETRO_DEVICE_JOYPAD, RETRO_DEVICE_ID_JOYPAD_L);

		SET_INPUT(RETRO_DEVICE_JOYPAD, RETRO_DEVICE_ID_JOYPAD_X);
		SET_INPUT(RETRO_DEVICE_JOYPAD, RETRO_DEVICE_ID_JOYPAD_B);
		SET_INPUT(RETRO_DEVICE_JOYPAD, RETRO_DEVICE_ID_JOYPAD_A);
		SET_INPUT(RETRO_DEVICE_JOYPAD, RETRO_DEVICE_ID_JOYPAD_Y);
		SET_INPUT(RETRO_DEVICE_JOYPAD, RETRO_DEVICE_ID_JOYPAD_R);

		SET_INPUT(RETRO_DEVICE_JOYPAD, RETRO_DEVICE_ID_JOYPAD_START);
		SET_INPUT(RETRO_DEVICE_JOYPAD, RETRO_DEVICE_ID_JOYPAD_SELECT);
	}

	#undef SET_INPUT
}

static void update_video(JUN_App *app)
{
	const void *data = JUN_CoreGetFrameData();
	uint32_t width = JUN_CoreGetFrameWidth();
	uint32_t height = JUN_CoreGetFrameHeight();

	JUN_VideoUpdateContext(app->video, width, height);

	JUN_VideoClear(app->video);
	JUN_VideoDrawFrame(app->video, data);
	JUN_VideoDrawUI(app->video);
	JUN_VideoPresent(app->video);

}

static void update_audio(JUN_App *app)
{
	const void *data = JUN_CoreGetAudioData();
	uint32_t frames = JUN_CoreGetAudioFrames();

	if (JUN_StateHasAudio(app->state))
		JUN_AudioQueue(app->audio, data, frames);
}

static void update_state(JUN_App *app)
{
	if (JUN_StateShouldSaveState(app->state)) {
		JUN_CoreSaveState();
		JUN_StateToggleSaveState(app->state);
	}

	if (JUN_StateShouldRestoreState(app->state)) {
		JUN_CoreRestoreState();
		JUN_StateToggleRestoreState(app->state);
	}
}

static void run_iteration(void *opaque)
{
	JUN_App *app = opaque;

	uint8_t fast_forward = JUN_StateGetFastForward(app->state);

	update_inputs(app);

	JUN_AudioUpdate(app->audio, fast_forward);
	JUN_CoreRun(fast_forward);

	update_video(app);
	update_audio(app);
	update_state(app);

	if (JUN_StateShouldExit(app->state))
		emscripten_cancel_main_loop();
}

int main(int argc, const char *argv[])
{
	const char *system = argv[1];
	const char *rom = argv[2];
	const char *settings = argv[3];

	JUN_App *app = JUN_AppCreate();

	JUN_CoreCreate(system, rom, settings);

	if (!JUN_CoreStartGame()) {
		JUN_Log("Core for system '%s' failed to start rom '%s'", system, rom);
		return 1;
	}

	double sample_rate = JUN_CoreGetSampleRate();
	double frames_per_second = JUN_CoreGetFPS();
	JUN_AudioOpen(app->audio, sample_rate, frames_per_second);

	emscripten_set_main_loop_arg(run_iteration, app, 1000, 1);

	JUN_CoreDestroy();
	JUN_AppDestroy(&app);

	return 0;
}
