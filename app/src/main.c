#include <stdlib.h>
#include <stdio.h>
#include <string.h>

#include "encodings/base64.h"

#include "enums.h"
#include "filesystem.h"
#include "interop.h"
#include "debug.h"

#include "app.h"

#define PATH_SIZE 256

typedef void (*webview_func)(const char *id, const MTY_JSON *data);

static struct {
	JUN_App *app;
	MTY_Hash *interop;
	char *id;
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

static void webview_send_event(const char *id, const MTY_JSON *json)
{
	char *serialized = json ? MTY_JSONSerialize(json) : NULL;
	MTY_WebviewSendEvent(CTX.app->mty, 0, id, serialized);
	MTY_Free(serialized);
}

static bool app_func(void *opaque)
{
	if (!JUN_VideoAssetsReady(CTX.app->video) || !JUN_CoreHasStarted(CTX.app->core))
		return true;

	uint32_t factor = JUN_VideoComputeFramerate(CTX.app->video);
	JUN_CoreRun(CTX.app->core, JUN_StateGetFastForward(CTX.app->state) * factor);
	JUN_VideoPresent(CTX.app->video);

	JUN_CoreSaveMemories(CTX.app->core);

	if (JUN_StateShouldSaveState(CTX.app->state)) {
		JUN_CoreSaveState(CTX.app->core);
		JUN_StateToggleSaveState(CTX.app->state);
	}

	if (JUN_StateShouldRestoreState(CTX.app->state)) {
		JUN_CoreRestoreState(CTX.app->core);
		JUN_StateToggleRestoreState(CTX.app->state);
	}

	if (JUN_StateShouldExit(CTX.app->state)) {
		JUN_AppUnloadCore(CTX.app);
		JUN_InputReset(CTX.app->input);
		if (JUN_StateHasAudio(CTX.app->state))
			JUN_StateToggleAudio(CTX.app->state);
		JUN_StateToggleExit(CTX.app->state);
		JUN_FilesystemClearAllFiles();
		JUN_MemoryDump();

		MTY_WebviewShow(CTX.app->mty, 0, true);
		webview_send_event(CTX.id, NULL);
		MTY_Free(CTX.id);
		CTX.id = NULL;
	}

	return true;
}

static void get_version(const char *id, const MTY_JSON *json)
{
	char *version = JUN_InteropGetVersion();

	MTY_JSON *result = MTY_JSONObjCreate();
	MTY_JSONObjSetString(result, "version", version);

	webview_send_event(id, result);

	MTY_JSONDestroy(&result);
	MTY_Free(version);
}

static void prepare_core(const char *id, const MTY_JSON *json)
{
	MTY_WebviewShow(CTX.app->mty, 0, false);

	JUN_MemoryDump();

	char system[PATH_SIZE] = {0};
	MTY_JSONObjGetString(json, "system", system, PATH_SIZE);

	char rom[PATH_SIZE] = {0};
	MTY_JSONObjGetString(json, "rom", rom, PATH_SIZE);

	const MTY_JSON *settings = MTY_JSONObjGetItem(json, "settings");

	JUN_AppLoadCore(CTX.app, system, rom, settings);

	MTY_JSON *result = MTY_JSONObjCreate();
	MTY_JSONObjSetString(result, "game",   JUN_AppGetPath(CTX.app, JUN_FILE_GAME));
	MTY_JSONObjSetString(result, "save",   JUN_AppGetPath(CTX.app, JUN_FOLDER_SAVES));
	MTY_JSONObjSetString(result, "system", JUN_AppGetPath(CTX.app, JUN_FOLDER_SYSTEM));
	MTY_JSONObjSetString(result, "cheat",  JUN_AppGetPath(CTX.app, JUN_FOLDER_CHEATS));

	webview_send_event(id, result);

	MTY_JSONDestroy(&result);
}

static void start_game(const char *id, const MTY_JSON *json)
{
	char *path = NULL;
	size_t length = 0;

	for (size_t index = 0; JUN_InteropReadDir("/", index, &path); index++) {
		void *data = JUN_InteropReadFile(path, &length);
		JUN_FilesystemSaveFile(path, data, length, false);
	}

	JUN_CoreSetCallbacks(CTX.app->core, & (JUN_CoreCallbacks) {
		environment,
		video_refresh,
		audio_sample,
		audio_sample_batch,
		input_poll,
		input_state,
	});

	if (!JUN_CoreStartGame(CTX.app->core)) {
		webview_send_event(id, NULL);
		return;
	}

	double sample_rate = JUN_CoreGetSampleRate(CTX.app->core);
	double frames_per_second = JUN_CoreGetFramesPerSecond(CTX.app->core);

	JUN_AudioPrepare(CTX.app->audio, sample_rate, frames_per_second);

	JUN_CoreRestoreMemories(CTX.app->core);
	JUN_CoreSetCheats(CTX.app->core);

	CTX.id = MTY_Strdup(id);
}

static void get_languages(const char *id, const MTY_JSON *json)
{
	MTY_JSON *languages = JUN_EnumsGetAll(JUN_ENUM_LANGUAGE);

	webview_send_event(id, languages);

	MTY_JSONDestroy(&languages);
}

static void get_bindings(const char *id, const MTY_JSON *json)
{
	MTY_JSON *joypad = JUN_EnumsGetAll(JUN_ENUM_JOYPAD);
	MTY_JSON *keyboard = JUN_EnumsGetAll(JUN_ENUM_KEYBOARD);

	MTY_JSON *bindings = MTY_JSONObjCreate();
	MTY_JSONObjSetItem(bindings, "joypad", joypad);
	MTY_JSONObjSetItem(bindings, "keyboard", keyboard);

	webview_send_event(id, bindings);

	MTY_JSONDestroy(&bindings);
}

static void get_settings(const char *id, const MTY_JSON *json)
{
	webview_send_event(id, JUN_CoreGetDefaultConfiguration());
}

static void event_func(const MTY_Event *event, void *opaque)
{
	if (!CTX.app)
		return;

	JUN_InputSetStatus(CTX.app->input, event);

	if (event->type == MTY_EVENT_WEBVIEW) {
		MTY_JSON *json = MTY_JSONParse(event->message);

		const char *id = MTY_JSONObjGetStringPtr(json, "id");
		const char *type = MTY_JSONObjGetStringPtr(json, "type");
		const MTY_JSON *data = MTY_JSONObjGetItem(json, "data");

		webview_func binding = MTY_HashGet(CTX.interop, type);
		binding(id, data);

		MTY_JSONDestroy(&json);

	} else {
		JUN_PrintEvent(event);
	}

	if (event->type == MTY_EVENT_CLOSE)
		JUN_StateToggleExit(CTX.app->state);
}

static MTY_Hash *create_bindings()
{
	MTY_Hash *interop = MTY_HashCreate(0);

	MTY_HashSet(interop, "get_version", get_version);
	MTY_HashSet(interop, "get_languages", get_languages);
	MTY_HashSet(interop, "get_bindings", get_bindings);
	MTY_HashSet(interop, "get_settings", get_settings);
	MTY_HashSet(interop, "prepare_core", prepare_core);
	MTY_HashSet(interop, "start_game", start_game);

	return interop;
}

int main(int argc, char *argv[])
{
	JUN_SetLogFunc();

	JUN_EnumsCreate();
	JUN_FilesystemCreate();
	CTX.interop = create_bindings();
	CTX.app = JUN_AppCreate(app_func, event_func);

	JUN_VideoPrepareAssets(CTX.app->video);
	JUN_VideoStart(CTX.app->video);

	JUN_AppDestroy(&CTX.app);
	MTY_HashDestroy(&CTX.interop, NULL);
	JUN_FilesystemDestroy();
	JUN_EnumsDestroy();

	return 0;
}
