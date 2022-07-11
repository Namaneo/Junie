#include <stdlib.h>
#include <stdio.h>
#include <string.h>

#include "enums.h"
#include "filesystem.h"
#include "interop.h"
#include "memory.h"

#include "app.h"

JUN_App *app;
MTY_Webview *current_webview;
uint32_t current_serial;
bool adaptive_framerate;

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
	// TODO get input snapshot
	// TODO reset input status
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

static bool app_func(void *opaque)
{
	uint32_t factor = JUN_VideoComputeFramerate(app->video);
	if (!adaptive_framerate)
		factor = 1;

	if (!JUN_CoreHasStarted(app->core))
		return true;

	for (int i = 0; i < JUN_StateGetFastForward(app->state) * factor; ++i)
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

	if (JUN_StateShouldExit(app->state)) {
		JUN_AppUnloadCore(app);
		JUN_InputReset(app->input);
		if (JUN_StateHasAudio(app->state))
			JUN_StateToggleAudio(app->state);
		JUN_StateToggleExit(app->state);
		JUN_MemoryDump();
		MTY_WebviewInteropReturn(current_webview, current_serial, true, NULL);
	}

	return true;
}

static void start_game(MTY_Webview *ctx, uint32_t serial, const MTY_JSON *json, void *opaque)
{
	JUN_MemoryDump();

	char system[PATH_SIZE] = {0};
	MTY_JSONObjGetString(json, "system", system, PATH_SIZE);

	char rom[PATH_SIZE] = {0};
	MTY_JSONObjGetString(json, "rom", rom, PATH_SIZE);

	const MTY_JSON *settings = MTY_JSONObjGetItem(json, "settings");

	// TODO: Should be deduced at runtime, when the system is not powerful enough
	MTY_JSONObjGetBool(settings, "adaptive_framerate", &adaptive_framerate);

	JUN_AppLoadCore(app, system, rom, settings);

	JUN_CoreSetCallbacks(app->core, & (JUN_CoreCallbacks) {
		environment,
		video_refresh,
		audio_sample,
		audio_sample_batch,
		input_poll,
		input_state,
	});

	if (!JUN_CoreStartGame(app->core)) {
		MTY_WebviewInteropReturn(ctx, serial, false, NULL);
		return;
	}

	double sample_rate = JUN_CoreGetSampleRate(app->core);
	double frames_per_second = JUN_CoreGetFramesPerSecond(app->core);

	JUN_AudioPrepare(app->audio, sample_rate, frames_per_second);

	JUN_CoreRestoreMemories(app->core);

	JUN_CoreSetCheats(app->core);

	current_webview = ctx;
	current_serial = serial;
}

static void refresh_files(MTY_Webview *ctx, uint32_t serial, const MTY_JSON *json, void *opaque)
{
	JUN_InteropRefreshFiles();
}

static void get_languages(MTY_Webview *ctx, uint32_t serial, const MTY_JSON *json, void *opaque)
{
	MTY_JSON *languages = JUN_EnumsGetAll(JUN_ENUM_LANGUAGE);

	MTY_WebviewInteropReturn(ctx, serial, true, languages);

	MTY_JSONDestroy(&languages);
}

static void get_bindings(MTY_Webview *ctx, uint32_t serial, const MTY_JSON *json, void *opaque)
{
	MTY_JSON *joypad = JUN_EnumsGetAll(JUN_ENUM_JOYPAD);
	MTY_JSON *keyboard = JUN_EnumsGetAll(JUN_ENUM_KEYBOARD);

	MTY_JSON *bindings = MTY_JSONObjCreate();
	MTY_JSONObjSetItem(bindings, "joypad", joypad);
	MTY_JSONObjSetItem(bindings, "keyboard", keyboard);

	MTY_WebviewInteropReturn(ctx, serial, true, bindings);

	MTY_JSONDestroy(&bindings);
}

static void get_settings(MTY_Webview *ctx, uint32_t serial, const MTY_JSON *json, void *opaque)
{
	MTY_WebviewInteropReturn(ctx, serial, true, JUN_CoreGetDefaultConfiguration());
}

static void event_func(const MTY_Event *event, void *opaque)
{
	JUN_InputSetStatus(app->input, event);

	MTY_PrintEvent(event);

	if (event->type == MTY_EVENT_CLOSE)
		JUN_StateToggleExit(app->state);
}

static void log_func(const char *message, void *opaque)
{
	if (message[strlen(message) - 1] != '\n')
		printf("%s\n", message);
	else
		printf("%s", message);
}

static void on_ui_created(MTY_Webview *webview, void *opaque)
{
	MTY_WebviewInteropBind(webview, "junie_start_game", start_game, NULL);
	MTY_WebviewInteropBind(webview, "junie_refresh_files", refresh_files, NULL);
	MTY_WebviewInteropBind(webview, "junie_get_languages", get_languages, NULL);
	MTY_WebviewInteropBind(webview, "junie_get_bindings", get_bindings, NULL);
	MTY_WebviewInteropBind(webview, "junie_get_settings", get_settings, NULL);
}

int main(int argc, char *argv[])
{
	MTY_SetLogFunc(log_func, NULL);

	JUN_EnumsCreate();
	JUN_FilesystemCreate();
	app = JUN_AppCreate(app_func, event_func);

	JUN_VideoCreateUI(app->video, on_ui_created, NULL);

	JUN_VideoStart(app->video);

	JUN_AppDestroy(&app);
	JUN_FilesystemDestroy();
	JUN_EnumsDestroy();

	return 0;
}
