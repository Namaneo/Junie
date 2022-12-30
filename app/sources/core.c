#include <stdio.h>
#include <string.h>
#include <SDL2/SDL.h>

#include "libretro.h"
#include "stb_ds.h"
#include "parson.h"

#include "filesystem.h"
#include "interop.h"

#include "core.h"

#if defined(DYNAMIC)
#define LOAD_LIBRARY(path)   CTX.sym.library = SDL_LoadObject(path);
#define UNLOAD_LIBRARY()     SDL_UnloadObject(CTX.sym.library);
#define MAP_SYMBOL(function) CTX.sym.function = SDL_LoadFunction(CTX.sym.library, #function);
#else
#define LOAD_LIBRARY(path)   {}
#define UNLOAD_LIBRARY()     {}
#define MAP_SYMBOL(function) CTX.sym.function = function;
#endif

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
	void *library;
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
	void (*retro_set_controller_port_device)(unsigned port, unsigned device);
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

static struct CTX {
	bool initialized;

	struct { uint32_t key; char *value; } *paths;
	JUN_CoreCallbacks callbacks;

	JSON_Value *settings;
	JSON_Value *overrides;

	struct retro_game_info game;
	struct retro_system_info system;
	struct retro_system_av_info av;
	enum retro_pixel_format format;

	uint32_t last_save;
	uint32_t before_run;
    uint32_t after_run;
    float remaining_frames;

	struct jun_core_sym sym;
} CTX;

static void initialize_symbols(const char *path)
{
	if (CTX.sym.initialized)
		return;

	LOAD_LIBRARY(path);

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
	MAP_SYMBOL(retro_set_controller_port_device);
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

	CTX.settings = json_value_init_object();

	const struct retro_variable *variables = data;

	for (size_t i = 0; i < SIZE_MAX; i++) {
		const struct retro_variable *variable = &variables[i];

		if (!variable->key || !variable->value)
			break;

		SDL_LogInfo(0, "SET -> %s: %s", variable->key, variable->value);

		JSON_Value *item = json_value_init_object();

		char *ptr = NULL;
		char *value = SDL_strdup(variable->value);

		char *name = SDL_strtokr(value, ";", &ptr);
		json_object_set_string(json_object(item), "name", name);

		ptr += 1;
		char *element = SDL_strtokr(NULL, "|", &ptr);
		json_object_set_string(json_object(item), "default", element);

		JSON_Array *options = json_array(json_value_init_array());
		while (element) {
			json_array_append_string(options, element);
			element = SDL_strtokr(NULL, "|", &ptr);
		}
		json_object_set_value(json_object(item), "options", json_array_get_wrapping_value(options));

		json_object_set_value(json_object(CTX.settings), variable->key, item);

		free(value);
	}

	return true;
}

static char *remove_extension(const char *str)
{
	if (!str)
		return NULL;

	size_t length = (uint64_t) strrchr(str, '.') - (uint64_t) str;
	char *result = calloc(length + 1, 1);
	memcpy(result, str, length);

	return result;
}

static void create_paths(const char *system, const char *rom)
{
	char *path_system = NULL;
	char *path_game = NULL;
	char *path_saves = NULL;
	char *path_state = NULL;
	char *path_sram = NULL;
	char *path_rtc = NULL;
	char *path_cheats = NULL;

	char *game = remove_extension(rom);

	SDL_asprintf(&path_system, "%s",             system);
	SDL_asprintf(&path_game,   "%s/%s",          system, rom);
	SDL_asprintf(&path_saves,  "%s/%s",          system, game);
	SDL_asprintf(&path_state,  "%s/%s/%s.state", system, game, game);
	SDL_asprintf(&path_sram,   "%s/%s/%s.srm",   system, game, game);
	SDL_asprintf(&path_rtc,    "%s/%s/%s.rtc",   system, game, game);
	SDL_asprintf(&path_cheats, "%s/%s/%s.cht",   system, game, game);

	free(game);

	hmput(CTX.paths, JUN_PATH_SYSTEM, path_system);
	hmput(CTX.paths, JUN_PATH_GAME,   path_game);
	hmput(CTX.paths, JUN_PATH_SAVES,  path_saves);
	hmput(CTX.paths, JUN_PATH_STATE,  path_state);
	hmput(CTX.paths, JUN_PATH_SRAM,   path_sram);
	hmput(CTX.paths, JUN_PATH_RTC,    path_rtc);
	hmput(CTX.paths, JUN_PATH_CHEATS, path_cheats);
}

void JUN_CoreCreate(const char *system, const char *rom, const char *settings, const char *library)
{
	JUN_FilesystemCreate();

	CTX.overrides = json_parse_string(settings);

	create_paths(system, rom);
	initialize_symbols(library);
}

static void core_log(enum retro_log_level level, const char *fmt, ...)
{
	va_list args;
	char buffer[4096] = {0};

	va_start(args, fmt);
	vsnprintf(buffer, sizeof(buffer), fmt, args);
	va_end(args);

	SDL_LogInfo(0, "%s", buffer);
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

			*system_directory = hmget(CTX.paths, JUN_PATH_SYSTEM);

			return true;
		}
		case RETRO_ENVIRONMENT_GET_SAVE_DIRECTORY: {
			const char **save_directory = data;

			*save_directory = hmget(CTX.paths, JUN_PATH_SAVES);

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

			SDL_LogInfo(0, "%s", message->msg);

			return true;
		}
		case RETRO_ENVIRONMENT_SET_VARIABLES: {
			jun_core_environment(cmd, data);

			return true;
		}
		case RETRO_ENVIRONMENT_GET_VARIABLE: {
			struct retro_variable *variable = data;

			const char *override = json_object_get_string(json_object(CTX.overrides), variable->key);
			if (override) {
				variable->value = override;

			} else {
				const JSON_Value *setting = json_object_get_value(json_object(CTX.settings), variable->key);

				if (setting)
					variable->value = json_object_get_string(json_object(setting), "default");
			}

			SDL_LogInfo(0, "GET -> %s: %s", variable->key, variable->value);

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
			SDL_LogInfo(0, "Unhandled command: %d", command);

			return false;
		}
	}
}

char *JUN_CoreGetDefaultConfiguration(const char *library)
{
	initialize_symbols(library);

	CTX.sym.retro_set_environment(jun_core_environment);
	CTX.sym.retro_init();

	char *settings = json_serialize_to_string(CTX.settings);

	JUN_CoreDestroy();

	return settings;
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

	const char *game_path = hmget(CTX.paths, JUN_PATH_GAME);
	JUN_File *game = JUN_FilesystemGetExistingFile(game_path);

	CTX.game.path = game->path;
	CTX.game.size = game->size;
	if (!CTX.system.need_fullpath) {
		CTX.game.data = calloc(CTX.game.size, 1);
		memcpy((void *) CTX.game.data, game->buffer, CTX.game.size);
	}

	CTX.initialized = CTX.sym.retro_load_game(&CTX.game);

	if (CTX.initialized)
		CTX.sym.retro_get_system_av_info(&CTX.av);

	CTX.sym.retro_set_controller_port_device(0, RETRO_DEVICE_JOYPAD);

	return CTX.initialized;
}

static uint32_t compute_framerate()
{
	uint32_t before_run = SDL_GetTicks();

    float total_loop = before_run - CTX.before_run;
    float time_run = CTX.after_run - CTX.before_run;
    float time_idle = before_run - CTX.after_run;

    CTX.before_run = before_run;

    bool throttling = time_run > time_idle;
	float framerate = 1000.0 / total_loop;

	CTX.remaining_frames += CTX.av.timing.fps / framerate;
	uint32_t pending = (uint32_t) CTX.remaining_frames;
	CTX.remaining_frames -= (float) pending;

	return pending <= 20 && !throttling ? pending : 1;
}

void JUN_CoreRun(uint8_t fast_forward)
{
	uint32_t count = compute_framerate();

	for (size_t i = 0; i < fast_forward * count; ++i)
		CTX.sym.retro_run();

	CTX.after_run = SDL_GetTicks();
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
	if (SDL_GetTicks() - CTX.last_save < 1000)
		return;

	CTX.last_save = SDL_GetTicks();

	const char *sram_path = hmget(CTX.paths, JUN_PATH_SRAM);
	const char *rtc_path = hmget(CTX.paths, JUN_PATH_RTC);

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
	const char *sram_path = hmget(CTX.paths, JUN_PATH_SRAM);
	const char *rtc_path = hmget(CTX.paths, JUN_PATH_RTC);

	restore_memory(RETRO_MEMORY_SAVE_RAM, sram_path);
	restore_memory(RETRO_MEMORY_RTC, rtc_path);
}

void JUN_CoreSetCheats()
{
	char *path = NULL;
	size_t index = 0;

	const char *cheats_path = hmget(CTX.paths, JUN_PATH_CHEATS);

	char *data = JUN_InteropReadFile(cheats_path, NULL);
	if (!data)
		return;

	JSON_Value *json = json_parse_string(data);
	for (size_t i = 0; i < json_array_get_count(json_array(json)); i++) {
		const JSON_Value *cheat = json_array_get_value(json_array(json), i);

		bool enabled = json_object_get_boolean(json_object(cheat), "enabled");
		if (!enabled)
			continue;

		int32_t order = json_object_get_number(json_object(cheat), "order");

		char *value = SDL_strdup(json_object_get_string(json_object(cheat), "value"));
		for (size_t i = 0; i < strlen(value); i++)
			if (value[i] == ' ' || value[i] == '\n')
				value[i] = '+';

		CTX.sym.retro_cheat_set(order, enabled, value);
	}

	json_value_free(json);
	free(data);
}

void JUN_CoreResetCheats()
{
	CTX.sym.retro_cheat_reset();
}

void JUN_CoreSaveState()
{
	size_t size = CTX.sym.retro_serialize_size();

	void *data = calloc(size, 1);

	CTX.sym.retro_serialize(data, size);

	const char *state_path = hmget(CTX.paths, JUN_PATH_STATE);
	JUN_FilesystemSaveFile(state_path, data, size);

	free(data);
}

void JUN_CoreRestoreState()
{
	size_t size = CTX.sym.retro_serialize_size();

	const char *state_path = hmget(CTX.paths, JUN_PATH_STATE);
	JUN_File *file = JUN_FilesystemGetExistingFile(state_path);
	if (!file)
		return;

	CTX.sym.retro_unserialize(file->buffer, size);
}

void JUN_CoreDestroy()
{
	CTX.sym.retro_deinit();

	json_value_free(CTX.settings);
	json_value_free(CTX.overrides);

	for (size_t i = 0; i < hmlen(CTX.paths); i++)
		free(CTX.paths[i].value);
	hmfree(CTX.paths);

	free((void *) CTX.game.data);

	UNLOAD_LIBRARY();

	CTX = (struct CTX) {0};

	JUN_FilesystemDestroy();
}
