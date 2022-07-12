#include <stdlib.h>
#include <stdio.h>
#include <string.h>

#include "enums.h"
#include "filesystem.h"
#include "interop.h"
#include "memory.h"

#include "app.h"

static struct {
	JUN_App *app;
	MTY_Webview *current_webview;
	uint32_t current_serial;
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

static bool app_func(void *opaque)
{
	if (!JUN_CoreHasStarted(CTX.app->core))
		return true;

	uint32_t factor = JUN_VideoComputeFramerate(CTX.app->video);

	for (int i = 0; i < JUN_StateGetFastForward(CTX.app->state) * factor; ++i)
		JUN_CoreRun(CTX.app->core);

	JUN_CoreSaveMemories(CTX.app->core);

	if (JUN_StateShouldSaveState(CTX.app->state)) {
		JUN_CoreSaveState(CTX.app->core);
		JUN_StateToggleSaveState(CTX.app->state);
	}

	if (JUN_StateShouldRestoreState(CTX.app->state)) {
		JUN_CoreRestoreState(CTX.app->core);
		JUN_StateToggleRestoreState(CTX.app->state);
	}

	JUN_VideoPresent(CTX.app->video);

	if (JUN_StateShouldExit(CTX.app->state)) {
		JUN_AppUnloadCore(CTX.app);
		JUN_InputReset(CTX.app->input);
		if (JUN_StateHasAudio(CTX.app->state))
			JUN_StateToggleAudio(CTX.app->state);
		JUN_StateToggleExit(CTX.app->state);
		JUN_MemoryDump();
		MTY_WebviewInteropReturn(CTX.current_webview, CTX.current_serial, true, NULL);
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

	JUN_AppLoadCore(CTX.app, system, rom, settings);

	JUN_CoreSetCallbacks(CTX.app->core, & (JUN_CoreCallbacks) {
		environment,
		video_refresh,
		audio_sample,
		audio_sample_batch,
		input_poll,
		input_state,
	});

	if (!JUN_CoreStartGame(CTX.app->core)) {
		MTY_WebviewInteropReturn(ctx, serial, false, NULL);
		return;
	}

	double sample_rate = JUN_CoreGetSampleRate(CTX.app->core);
	double frames_per_second = JUN_CoreGetFramesPerSecond(CTX.app->core);

	JUN_AudioPrepare(CTX.app->audio, sample_rate, frames_per_second);

	JUN_CoreRestoreMemories(CTX.app->core);

	JUN_CoreSetCheats(CTX.app->core);

	CTX.current_webview = ctx;
	CTX.current_serial = serial;
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
	JUN_InputSetStatus(CTX.app->input, event);

	MTY_PrintEvent(event);

	if (event->type == MTY_EVENT_CLOSE)
		JUN_StateToggleExit(CTX.app->state);
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
	CTX.app = JUN_AppCreate(app_func, event_func);

	JUN_VideoCreateUI(CTX.app->video, on_ui_created, NULL);

	JUN_VideoStart(CTX.app->video);

	JUN_AppDestroy(&CTX.app);
	JUN_FilesystemDestroy();
	JUN_EnumsDestroy();

	return 0;
}
