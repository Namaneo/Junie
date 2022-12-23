#include <stdio.h>
#include <string.h>

#include "libretro.h"

#include "filesystem.h"
#include "interop.h"

#include "core.h"

#define MAP_SYMBOL(function) CTX.sym.function = function;

typedef enum {
	JUN_PATH_GAME   = 1,
	JUN_PATH_STATE  = 2,
	JUN_PATH_SRAM   = 3,
	JUN_PATH_RTC    = 4,
	JUN_PATH_CHEATS = 7,
	JUN_PATH_SAVES  = 5,
	JUN_PATH_SYSTEM = 6,
	JUN_PATH_MAKE64 = UINT64_MAX
} JUN_PathType;

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
	JUN_CoreCallbacks callbacks;

	struct retro_game_info game;
	struct retro_system_info system;
	struct retro_system_av_info av;
	enum retro_pixel_format format;

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

static char *remove_extension(const char *str)
{
	if (!str)
		return NULL;

	size_t length = (uint64_t) strrchr(str, '.') - (uint64_t) str;
	char *result = MTY_Alloc(length + 1, 1);
	memcpy(result, str, length);

	return result;
}

void JUN_CoreCreate(const char *system, const char *rom, const char *settings)
{
	JUN_FilesystemCreate();

	CTX.paths = MTY_HashCreate(0);
	char *game = remove_extension(rom);

	MTY_HashSetInt(CTX.paths, JUN_PATH_SYSTEM, MTY_SprintfD("%s",             system));
	MTY_HashSetInt(CTX.paths, JUN_PATH_GAME,   MTY_SprintfD("%s/%s",          system, rom));
	MTY_HashSetInt(CTX.paths, JUN_PATH_SAVES,  MTY_SprintfD("%s/%s",          system, game));
	MTY_HashSetInt(CTX.paths, JUN_PATH_STATE,  MTY_SprintfD("%s/%s/%s.state", system, game, game));
	MTY_HashSetInt(CTX.paths, JUN_PATH_SRAM,   MTY_SprintfD("%s/%s/%s.srm",   system, game, game));
	MTY_HashSetInt(CTX.paths, JUN_PATH_RTC,    MTY_SprintfD("%s/%s/%s.rtc",   system, game, game));
	MTY_HashSetInt(CTX.paths, JUN_PATH_CHEATS, MTY_SprintfD("%s/%s/%s.cht",   system, game, game));

	CTX.configuration = JUN_ConfigurationCreate();
	MTY_JSON *overrides = MTY_JSONParse(settings);

	uint64_t iter = 0;
	const char *key = NULL;
	while (MTY_JSONObjGetNextKey(overrides, &iter, &key)) {
		const char *value = MTY_JSONObjGetStringPtr(overrides, key);
		JUN_ConfigurationOverride(CTX.configuration, key, value);
	}

	MTY_JSONDestroy(&overrides);

	initialize_symbols();
}

static void core_log(enum retro_log_level level, const char *fmt, ...)
{
	va_list args;
	char buffer[4096] = {0};

	va_start(args, fmt);
	vsnprintf(buffer, sizeof(buffer), fmt, args);
	va_end(args);

	MTY_Log("%s", buffer);
}

bool JUN_CoreEnvironment(unsigned cmd, void *data)
{
	unsigned command = cmd & ~RETRO_ENVIRONMENT_EXPERIMENTAL;
	switch (command) {
		case RETRO_ENVIRONMENT_SET_PIXEL_FORMAT: {
			enum retro_pixel_format *format = data;

			CTX.format = *format;

			return true;
		}
		case RETRO_ENVIRONMENT_GET_LOG_INTERFACE: {
			struct retro_log_callback *callback = data;

			callback->log = core_log;

			return true;
		}
		case RETRO_ENVIRONMENT_GET_SYSTEM_DIRECTORY: {
			const char **system_directory = data;

			*system_directory = MTY_HashGetInt(CTX.paths, JUN_PATH_SYSTEM);

			return true;
		}
		case RETRO_ENVIRONMENT_GET_SAVE_DIRECTORY: {
			const char **save_directory = data;

			*save_directory = MTY_HashGetInt(CTX.paths, JUN_PATH_SAVES);

			return true;
		}
		case RETRO_ENVIRONMENT_GET_VFS_INTERFACE & ~RETRO_ENVIRONMENT_EXPERIMENTAL: {
			struct retro_vfs_interface_info *vfs = data;

			vfs->iface = JUN_FilesystemGetInterface();
			vfs->required_interface_version = JUN_FilesystemGetInterfaceVersion();

			return true;
		}
		case RETRO_ENVIRONMENT_SET_MESSAGE: {
			struct retro_message *message = data;

			MTY_Log("%s", message->msg);

			return true;
		}
		case RETRO_ENVIRONMENT_SET_VARIABLES: {
			const struct retro_variable *variables = data;

			for (uint32_t x = 0; x < UINT32_MAX; x++)
			{
				const struct retro_variable *variable = &variables[x];

				if (!variable->key || !variable->value)
					break;

				JUN_ConfigurationSet(CTX.configuration, variable->key, variable->value);

				MTY_Log("SET -> %s: %s", variable->key, variable->value);
			}

			return true;
		}
		case RETRO_ENVIRONMENT_GET_VARIABLE: {
			struct retro_variable *variable = data;

			variable->value = JUN_ConfigurationGet(CTX.configuration, variable->key);

			MTY_Log("GET -> %s: %s", variable->key, variable->value);

			return variable->value != NULL;
		}
		case RETRO_ENVIRONMENT_GET_VARIABLE_UPDATE: {
			bool *update = data;

			*update = false;

			return true;
		}
		case RETRO_ENVIRONMENT_GET_AUDIO_VIDEO_ENABLE & ~RETRO_ENVIRONMENT_EXPERIMENTAL: {
			int *status = data;

			*status = 0;     // Reset
			*status |= 0b01; // Enable video
			*status |= 0b10; // Enable audio

			return true;
		}
		default: {
			MTY_Log("Unhandled command: %d", command);

			return false;
		}
	}
}

const MTY_JSON *JUN_CoreGetDefaultConfiguration()
{
	initialize_symbols();

	CTX.sym.retro_set_environment(jun_core_environment);
	CTX.sym.retro_init();
	CTX.sym.retro_deinit();

	return defaults;
}

void JUN_CoreSetCallbacks(JUN_CoreCallbacks *callbacks)
{
	CTX.callbacks = *callbacks;
}

double JUN_CoreGetSampleRate()
{
	return CTX.av.timing.sample_rate;
}

double JUN_CoreGetFramesPerSecond()
{
	return CTX.av.timing.fps;
}

enum retro_pixel_format JUN_CoreGetFormat()
{
	return CTX.format;
}

static bool environment(unsigned cmd, void *data)
{
	return CTX.callbacks.environment(cmd, data, CTX.callbacks.opaque);
}

static void video_refresh(const void *data, unsigned width, unsigned height, size_t pitch)
{
	CTX.callbacks.video_refresh(data, width, height, pitch, CTX.callbacks.opaque);
}

static void audio_sample(int16_t left, int16_t right)
{
	CTX.callbacks.audio_sample(left, right, CTX.callbacks.opaque);
}

static size_t audio_sample_batch(const int16_t *data, size_t frames)
{
	return CTX.callbacks.audio_sample_batch(data, frames, CTX.callbacks.opaque);
}

static void input_poll()
{
	CTX.callbacks.input_poll(CTX.callbacks.opaque);
}

static int16_t input_state(unsigned port, unsigned device, unsigned index, unsigned id)
{
	return CTX.callbacks.input_state(port, device, index, id, CTX.callbacks.opaque);
}

bool JUN_CoreStartGame()
{
	CTX.sym.retro_set_environment(environment);
	CTX.sym.retro_set_video_refresh(video_refresh);
	CTX.sym.retro_set_input_poll(input_poll);
	CTX.sym.retro_set_input_state(input_state);
	CTX.sym.retro_set_audio_sample(audio_sample);
	CTX.sym.retro_set_audio_sample_batch(audio_sample_batch);

	CTX.sym.retro_init();

	CTX.sym.retro_get_system_info(&CTX.system);

	const char *game_path = MTY_HashGetInt(CTX.paths, JUN_PATH_GAME);
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

	const char *sram_path = MTY_HashGetInt(CTX.paths, JUN_PATH_SRAM);
	const char *rtc_path = MTY_HashGetInt(CTX.paths, JUN_PATH_RTC);

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
	const char *sram_path = MTY_HashGetInt(CTX.paths, JUN_PATH_SRAM);
	const char *rtc_path = MTY_HashGetInt(CTX.paths, JUN_PATH_RTC);

	restore_memory(RETRO_MEMORY_SAVE_RAM, sram_path);
	restore_memory(RETRO_MEMORY_RTC, rtc_path);
}

void JUN_CoreSetCheats()
{
	char *path = NULL;
	size_t index = 0;

	const char *cheats_path = MTY_HashGetInt(CTX.paths, JUN_PATH_CHEATS);

	char *data = JUN_InteropReadFile(cheats_path, NULL);
	if (!data)
		return;

	MTY_JSON *json = MTY_JSONParse(data);
	for (size_t i = 0; i < MTY_JSONArrayGetLength(json); ++i) {
		const MTY_JSON *cheat = MTY_JSONArrayGetItem(json, i);

		bool enabled = false;
		MTY_JSONObjGetBool(cheat, "enabled", &enabled);
		if (!enabled)
			continue;

		int32_t order = 0;
		MTY_JSONObjGetInt(cheat, "order", &order);

		char value[1024] = {0};
		MTY_JSONObjGetString(cheat, "value", value, 1024);
		for (size_t i = 0; i < strlen(value); i++) {
			if (value[i] == ' ' || value[i] == '\n')
				value[i] = '+';
		}

		CTX.sym.retro_cheat_set(order, enabled, value);
	}

	MTY_JSONDestroy(&json);
	MTY_Free(data);
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

	const char *state_path = MTY_HashGetInt(CTX.paths, JUN_PATH_STATE);
	JUN_FilesystemSaveFile(state_path, data, size);

	MTY_Free(data);
}

void JUN_CoreRestoreState()
{
	size_t size = CTX.sym.retro_serialize_size();

	const char *state_path = MTY_HashGetInt(CTX.paths, JUN_PATH_STATE);
	JUN_File *file = JUN_FilesystemGetExistingFile(state_path);
	if (!file)
		return;

	CTX.sym.retro_unserialize(file->buffer, size);
}

void JUN_CoreDestroy()
{
	JUN_ConfigurationDestroy(&CTX.configuration);
	MTY_HashDestroy(&CTX.paths, MTY_Free);

	CTX.sym.retro_deinit();

	if (CTX.game.data)
		MTY_Free((void *) CTX.game.data);

	JUN_FilesystemDestroy();
}
