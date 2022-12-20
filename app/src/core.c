#include <string.h>

#include "libretro.h"

#include "enums.h"
#include "filesystem.h"
#include "interop.h"

#include "core.h"

#define MAP_SYMBOL(function) CTX.sym.function = function;

struct jun_core_sym {
	bool initialized;

	void (*retro_init)(void);
	bool (*retro_load_game)(const struct retro_game_info *game);
	void (*retro_get_system_info)(struct retro_system_info *info);
	void (*retro_get_system_av_info)(struct retro_system_av_info *info);
	void (*retro_set_environment)(retro_environment_t);
	void (*retro_set_video_refresh)(retro_video_refresh_t);
	void (*retro_set_input_poll)(retro_input_poll_t);
	void (*retro_set_input_state)(retro_input_state_t);
	void (*retro_set_audio_sample)(retro_audio_sample_t);
	void (*retro_set_audio_sample_batch)(retro_audio_sample_batch_t);
	size_t (*retro_get_memory_size)(unsigned type);
	void *(*retro_get_memory_data)(unsigned type);
	size_t (*retro_serialize_size)(void);
	bool (*retro_serialize)(void *data, size_t size);
	bool (*retro_unserialize)(const void *data, size_t size);
	void (*retro_cheat_reset)(void);
	void (*retro_cheat_set)(unsigned index, bool enabled, const char *code);
	void (*retro_run)(void);
	void (*retro_reset)(void);
	void (*retro_unload_game)(void);
	void (*retro_deinit)(void);
};

static MTY_JSON *defaults;

static struct {
	void *handle;
	bool initialized;

	MTY_Hash *paths;

	MTY_Time last_save;

	JUN_Configuration *configuration;

	struct retro_game_info game;
	struct retro_system_info system;
	struct retro_system_av_info av;

	struct jun_core_sym sym;
} CTX;

static void initialize_symbols()
{
	if (CTX.sym.initialized)
		return;

	MAP_SYMBOL(retro_init);
	MAP_SYMBOL(retro_load_game);
	MAP_SYMBOL(retro_get_system_info);
	MAP_SYMBOL(retro_get_system_av_info);
	MAP_SYMBOL(retro_set_environment);
	MAP_SYMBOL(retro_set_video_refresh);
	MAP_SYMBOL(retro_set_input_poll);
	MAP_SYMBOL(retro_set_input_state);
	MAP_SYMBOL(retro_set_audio_sample);
	MAP_SYMBOL(retro_set_audio_sample_batch);
	MAP_SYMBOL(retro_get_memory_size);
	MAP_SYMBOL(retro_get_memory_data);
	MAP_SYMBOL(retro_serialize_size);
	MAP_SYMBOL(retro_serialize);
	MAP_SYMBOL(retro_unserialize);
	MAP_SYMBOL(retro_cheat_reset);
	MAP_SYMBOL(retro_cheat_set);
	MAP_SYMBOL(retro_run);
	MAP_SYMBOL(retro_reset);
	MAP_SYMBOL(retro_unload_game);
	MAP_SYMBOL(retro_deinit);

	CTX.sym.initialized = true;
}

static bool jun_core_environment(unsigned cmd, void *data)
{
	unsigned command = cmd & ~RETRO_ENVIRONMENT_EXPERIMENTAL;
	if (command != RETRO_ENVIRONMENT_SET_VARIABLES)
		return false;

	defaults = MTY_JSONArrayCreate(100);

	const struct retro_variable *variables = data;

	for (size_t i_entry = 0; i_entry < SIZE_MAX; i_entry++) {
		const struct retro_variable *variable = &variables[i_entry];

		if (!variable->key || !variable->value)
			break;

		MTY_JSON *item = MTY_JSONObjCreate();
		MTY_JSONObjSetString(item, "key", variable->key);

		char *ptr = NULL;
		char *value = MTY_Strdup(variable->value);

		char *name = MTY_Strtok(value, ";", &ptr);
		MTY_JSONObjSetString(item, "name", name);

		ptr += 1;
		char *element = MTY_Strtok(NULL, "|", &ptr);
		MTY_JSONObjSetString(item, "default", element);

		uint32_t i_option = 0;
		MTY_JSON *options = MTY_JSONArrayCreate(100);
		while (element) {
			MTY_JSONArraySetString(options, i_option, element);
			element = MTY_Strtok(NULL, "|", &ptr);
			i_option++;
		}
		MTY_JSONObjSetItem(item, "options", options);

		MTY_JSONArraySetItem(defaults, i_entry, item);

		MTY_Free(value);
	}

	return true;
}

void JUN_CoreCreate(MTY_Hash *paths)
{
	CTX.configuration = JUN_ConfigurationCreate();
	CTX.paths = paths;

	initialize_symbols();
}

const MTY_JSON *JUN_CoreGetDefaultConfiguration()
{
	initialize_symbols();

	CTX.sym.retro_set_environment(jun_core_environment);
	CTX.sym.retro_init();
	CTX.sym.retro_deinit();

	return defaults;
}

JUN_Configuration *JUN_CoreGetConfiguration()
{
	return CTX.configuration;
}

void JUN_CoreSetCallbacks(JUN_CoreCallbacks *callbacks)
{
	CTX.sym.retro_set_environment(callbacks->environment);
	CTX.sym.retro_set_video_refresh(callbacks->video_refresh);
	CTX.sym.retro_set_input_poll(callbacks->input_poll);
	CTX.sym.retro_set_input_state(callbacks->input_state);
	CTX.sym.retro_set_audio_sample(callbacks->audio_sample);
	CTX.sym.retro_set_audio_sample_batch(callbacks->audio_sample_batch);
}

double JUN_CoreGetSampleRate()
{
	return CTX.av.timing.sample_rate;
}

double JUN_CoreGetFramesPerSecond()
{
	return CTX.av.timing.fps;
}

bool JUN_CoreStartGame()
{
	CTX.sym.retro_init();

	CTX.sym.retro_get_system_info(&CTX.system);

	const char *game_path = MTY_HashGetInt(CTX.paths, JUN_FILE_GAME);
	JUN_File *game = JUN_FilesystemGetExistingFile(game_path);

	CTX.game.path = game->path;
	CTX.game.size = game->size;
	if (!CTX.system.need_fullpath) {
		CTX.game.data = MTY_Alloc(CTX.game.size, 1);
		memcpy((void *) CTX.game.data, game->buffer, CTX.game.size);
	}

	CTX.initialized = CTX.sym.retro_load_game(&CTX.game);

	if (CTX.initialized)
		CTX.sym.retro_get_system_av_info(&CTX.av);

	return CTX.initialized;
}

bool JUN_CoreHasStarted()
{
	return CTX.initialized;
}

void JUN_CoreRun(size_t count)
{
	for (int i = 0; i < count; ++i)
		CTX.sym.retro_run();
}

void save_memory(uint32_t type, const char *path)
{
	void *buffer = CTX.sym.retro_get_memory_data(type);
	if (!buffer)
		return;

	size_t size = CTX.sym.retro_get_memory_size(type);
	if (!size)
		return;

	JUN_FilesystemSaveFile(path, buffer, size);
}

void JUN_CoreSaveMemories()
{
	if (MTY_TimeDiff(CTX.last_save, MTY_GetTime()) < 1000)
		return;

	CTX.last_save = MTY_GetTime();

	const char *sram_path = MTY_HashGetInt(CTX.paths, JUN_FILE_SRAM);
	const char *rtc_path = MTY_HashGetInt(CTX.paths, JUN_FILE_RTC);

	save_memory(RETRO_MEMORY_SAVE_RAM, sram_path);
	save_memory(RETRO_MEMORY_RTC, rtc_path);
}

static void restore_memory(uint32_t type, const char *path)
{
	void *buffer = CTX.sym.retro_get_memory_data(type);
	if (!buffer)
		return;

	size_t size = CTX.sym.retro_get_memory_size(type);
	if (!size)
		return;

	JUN_File *file = JUN_FilesystemGetExistingFile(path);
	if (!file)
		return;

	memcpy(buffer, file->buffer, file->size);
}

void JUN_CoreRestoreMemories()
{
	const char *sram_path = MTY_HashGetInt(CTX.paths, JUN_FILE_SRAM);
	const char *rtc_path = MTY_HashGetInt(CTX.paths, JUN_FILE_RTC);

	restore_memory(RETRO_MEMORY_SAVE_RAM, sram_path);
	restore_memory(RETRO_MEMORY_RTC, rtc_path);
}

void JUN_CoreSetCheats()
{
	char *path = NULL;
	size_t index = 0;

	const char *cheats_path = MTY_HashGetInt(CTX.paths, JUN_FOLDER_CHEATS);

	// while (JUN_InteropReadDir(cheats_path, index++, &path)) {
	// 	void *cheat = JUN_FilesystemGetExistingFile(path);
	// 	MTY_JSON *json = MTY_JSONParse(cheat);

	// 	bool enabled = false;
	// 	MTY_JSONObjGetBool(json, "enabled", &enabled);
	// 	if (!enabled)
	// 		continue;

	// 	int32_t order = 0;
	// 	MTY_JSONObjGetInt(json, "order", &order);

	// 	char value[1024] = {0};
	// 	MTY_JSONObjGetString(json, "value", value, 1024);
	// 	for (size_t i = 0; i < strlen(value); i++) {
	// 		if (value[i] == ' ' || value[i] == '\n')
	// 			value[i] = '+';
	// 	}

	// 	CTX.sym.retro_cheat_set(order, enabled, value);

	// 	MTY_JSONDestroy(&json);
	// }
}

void JUN_CoreResetCheats()
{
	CTX.sym.retro_cheat_reset();
}

void JUN_CoreSaveState()
{
	size_t size = CTX.sym.retro_serialize_size();

	void *data = MTY_Alloc(size, 1);

	CTX.sym.retro_serialize(data, size);

	const char *state_path = MTY_HashGetInt(CTX.paths, JUN_FILE_STATE);
	JUN_FilesystemSaveFile(state_path, data, size);

	MTY_Free(data);
}

void JUN_CoreRestoreState()
{
	size_t size = CTX.sym.retro_serialize_size();

	const char *state_path = MTY_HashGetInt(CTX.paths, JUN_FILE_STATE);
	JUN_File *file = JUN_FilesystemGetExistingFile(state_path);
	if (!file)
		return;

	CTX.sym.retro_unserialize(file->buffer, size);
}

void JUN_CoreDestroy()
{
	JUN_ConfigurationDestroy(&CTX.configuration);

	CTX.sym.retro_deinit();

	if (CTX.game.data)
		MTY_Free((void *) CTX.game.data);
}
