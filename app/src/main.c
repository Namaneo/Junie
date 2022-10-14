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

static struct {
	JUN_App *app;
	MTY_Webview *current_webview;
	uint32_t current_serial;
	uint32_t file_count;
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
		MTY_WebviewInteropReturn(CTX.current_webview, CTX.current_serial, true, NULL);
		JUN_MemoryDump();
	}

	return true;
}

static void get_version(MTY_Webview *ctx, uint32_t serial, const MTY_JSON *json, void *opaque)
{
	char *version = JUN_InteropGetVersion();

	MTY_JSON *result = MTY_JSONObjCreate();
	MTY_JSONObjSetString(result, "version", version);

	MTY_WebviewInteropReturn(ctx, serial, true, result);

	MTY_JSONDestroy(&result);
	MTY_Free(version);
}

static void on_prepare_file(char *path, void *data, size_t length, void *opaque)
{
	JUN_FilesystemSaveFile(path, data, length);

	CTX.file_count--;

	if (!CTX.file_count)
		MTY_WebviewInteropReturn(CTX.current_webview, CTX.current_serial, true, NULL);

	MTY_Free(path);
	MTY_Free(data);
}

static void prepare_game(MTY_Webview *ctx, uint32_t serial, const MTY_JSON *json, void *opaque)
{
	MTY_WebviewAutomaticSize(ctx, false);
	MTY_WebviewSetSize(ctx, 0, 0);

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

	CTX.current_webview = ctx;
	CTX.current_serial = serial;

	MTY_ListNode *node = MTY_ListGetFirst(files);
	while (node) {
		JUN_InteropReadFile(node->value, on_prepare_file, NULL);
		node = node->next;
	}

	MTY_ListDestroy(&files, MTY_Free);
}

static void start_game(MTY_Webview *ctx, uint32_t serial, const MTY_JSON *json, void *opaque)
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

static void clear_game(MTY_Webview *ctx, uint32_t serial, const MTY_JSON *json, void *opaque)
{
	JUN_FilesystemClearAllFiles();

	MTY_WebviewAutomaticSize(ctx, true);
	MTY_WebviewSetSize(ctx, 0, 0);

	MTY_WebviewInteropReturn(ctx, serial, true, NULL);
}

static void event_func(const MTY_Event *event, void *opaque)
{
	JUN_InputSetStatus(CTX.app->input, event);

	JUN_PrintEvent(event);

	if (event->type == MTY_EVENT_CLOSE)
		JUN_StateToggleExit(CTX.app->state);
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

static void list_files(MTY_Webview *ctx, uint32_t serial, const MTY_JSON *json, void *opaque)
{
	const char *path = MTY_JSONObjGetFullString(json, "path");

	MTY_JSON *result = MTY_JSONArrayCreate(0);

	char *file = NULL;
	for (size_t index = 0; JUN_InteropReadDir(path, index, &file); index++) {
		MTY_JSONArraySetString(result, index, file);
		MTY_Free(file);
	}

	MTY_WebviewInteropReturn(ctx, serial, true, result);

	MTY_JSONDestroy(&result);
}

static void on_read_file(char *path, void *data_raw, size_t data_raw_len, void *opaque)
{
	MTY_Webview *ctx = (MTY_Webview *) ((uint64_t *) opaque)[0];
	uint32_t serial = (uint32_t) ((uint64_t *) opaque)[1];

	if (!data_raw) {
		MTY_WebviewInteropReturn(ctx, serial, true, NULL);
		return;
	}

	int32_t data_len = 0;
	char *data = base64(data_raw, data_raw_len, &data_len);

	MTY_JSON *result = MTY_JSONObjCreate();

	MTY_JSONObjSetString(result, "path", path);
	MTY_JSONObjSetString(result, "data", data);

	MTY_WebviewInteropReturn(ctx, serial, true, result);

	MTY_JSONDestroy(&result);
	MTY_Free(data);
	MTY_Free(data_raw);

	MTY_Free(path);
	MTY_Free(opaque);
}

static void read_file(MTY_Webview *ctx, uint32_t serial, const MTY_JSON *json, void *opaque)
{
	const char *path = MTY_JSONObjGetFullString(json, "path");

	uint64_t *new_opaque = MTY_Alloc(2, sizeof(uint64_t));
	new_opaque[0] = (uint64_t) ctx;
	new_opaque[1] = (uint64_t) serial;

	JUN_InteropReadFile(path, on_read_file, new_opaque);
}

static void write_file(MTY_Webview *ctx, uint32_t serial, const MTY_JSON *json, void *opaque)
{
	const char *path = MTY_JSONObjGetFullString(json, "path");
	const char *data = MTY_JSONObjGetFullString(json, "data");

	int32_t data_raw_len = 0;
	void *data_raw = unbase64(data, strlen(data), &data_raw_len);
	JUN_InteropWriteFile(path, data_raw, data_raw_len);

	MTY_WebviewInteropReturn(ctx, serial, true, NULL);

	MTY_Free(data_raw);
}

static void remove_file(MTY_Webview *ctx, uint32_t serial, const MTY_JSON *json, void *opaque)
{
	const char *path = MTY_JSONObjGetFullString(json, "path");

	JUN_InteropRemoveFile(path);

	MTY_WebviewInteropReturn(ctx, serial, true, NULL);
}

static void on_ui_created(MTY_Webview *webview, void *opaque)
{
	MTY_WebviewInteropBind(webview, "junie_get_version", get_version, NULL);

	MTY_WebviewInteropBind(webview, "junie_prepare_game", prepare_game, NULL);
	MTY_WebviewInteropBind(webview, "junie_start_game", start_game, NULL);
	MTY_WebviewInteropBind(webview, "junie_clear_game", clear_game, NULL);

	MTY_WebviewInteropBind(webview, "junie_get_languages", get_languages, NULL);
	MTY_WebviewInteropBind(webview, "junie_get_bindings", get_bindings, NULL);
	MTY_WebviewInteropBind(webview, "junie_get_settings", get_settings, NULL);

	MTY_WebviewInteropBind(webview, "junie_list_files", list_files, NULL);
	MTY_WebviewInteropBind(webview, "junie_read_file", read_file, NULL);
	MTY_WebviewInteropBind(webview, "junie_write_file", write_file, NULL);
	MTY_WebviewInteropBind(webview, "junie_remove_file", remove_file, NULL);
}

int main(int argc, char *argv[])
{
	JUN_SetLogFunc();

	JUN_EnumsCreate();
	JUN_FilesystemCreate();
	CTX.app = JUN_AppCreate(app_func, event_func);

	JUN_VideoCreateUI(CTX.app->video, on_ui_created, NULL);
	JUN_VideoPrepareAssets(CTX.app->video);

	JUN_VideoStart(CTX.app->video);

	JUN_AppDestroy(&CTX.app);
	JUN_FilesystemDestroy();
	JUN_EnumsDestroy();

	return 0;
}
