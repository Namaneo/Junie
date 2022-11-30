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
	uint32_t file_count;
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
		JUN_MemoryDump();

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

static void on_prepare_file(char *path, void *data, size_t length, void *opaque)
{
	char *id = opaque;

	JUN_FilesystemSaveFile(path, data, length, false);

	CTX.file_count--;

	if (!CTX.file_count)
		webview_send_event(id, NULL);

	MTY_Free(path);
	MTY_Free(data);
	MTY_Free(id);
}

static void prepare_game(const char *id, const MTY_JSON *json)
{
	MTY_WebviewShow(CTX.app->mty, 0, false);

	JUN_MemoryDump();

	char system[PATH_SIZE] = {0};
	MTY_JSONObjGetString(json, "system", system, PATH_SIZE);

	char rom[PATH_SIZE] = {0};
	MTY_JSONObjGetString(json, "rom", rom, PATH_SIZE);

	const MTY_JSON *settings = MTY_JSONObjGetItem(json, "settings");

	JUN_AppLoadCore(CTX.app, system, rom, settings);

	const char *game_path   = JUN_AppGetPath(CTX.app, JUN_FILE_GAME);
	const char *save_path   = JUN_AppGetPath(CTX.app, JUN_FOLDER_SAVES);
	const char *system_path = JUN_AppGetPath(CTX.app, JUN_FOLDER_SYSTEM);
	const char *cheat_path  = JUN_AppGetPath(CTX.app, JUN_FOLDER_CHEATS);

	MTY_List *files = MTY_ListCreate();

	char *file = NULL;
	CTX.file_count = 0;

	MTY_ListAppend(files, MTY_Strdup(game_path));
	CTX.file_count++;

	for (size_t index = 0; JUN_InteropReadDir(save_path, index, &file); index++) {
		MTY_ListAppend(files, file);
		CTX.file_count++;
	}

	for (size_t index = 0; JUN_InteropReadDir(system_path, index, &file); index++) {
		MTY_ListAppend(files, file);
		CTX.file_count++;
	}

	for (size_t index = 0; JUN_InteropReadDir(cheat_path, index, &file); index++) {
		MTY_ListAppend(files, file);
		CTX.file_count++;
	}

	MTY_ListNode *node = MTY_ListGetFirst(files);
	while (node) {
		JUN_InteropReadFile(node->value, on_prepare_file, MTY_Strdup(id));
		node = node->next;
	}

	MTY_ListDestroy(&files, MTY_Free);
}

static void start_game(const char *id, const MTY_JSON *json)
{
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

static void clear_game(const char *id, const MTY_JSON *json)
{
	JUN_FilesystemClearAllFiles();

	MTY_WebviewShow(CTX.app->mty, 0, true);

	webview_send_event(id, NULL);
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

	MTY_HashSet(interop, "prepare_game", prepare_game);
	MTY_HashSet(interop, "start_game", start_game);
	MTY_HashSet(interop, "clear_game", clear_game);

	MTY_HashSet(interop, "get_languages", get_languages);
	MTY_HashSet(interop, "get_bindings", get_bindings);
	MTY_HashSet(interop, "get_settings", get_settings);

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
