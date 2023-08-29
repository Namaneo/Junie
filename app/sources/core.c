#include "core.h"

#include <stdio.h>
#include <stdlib.h>
#include <stdarg.h>
#include <string.h>
#include <pthread.h>
#include <time.h>

#include <EGL/egl.h>

#include "libretro.h"

#define LOG(msg, ...) core_log_params(__FUNCTION__, msg, __VA_ARGS__)

typedef enum {
	JUN_PATH_GAME   = 0,
	JUN_PATH_STATE  = 1,
	JUN_PATH_SRAM   = 2,
	JUN_PATH_RTC    = 3,
	JUN_PATH_CHEATS = 4,
	JUN_PATH_SAVES  = 5,
	JUN_PATH_SYSTEM = 6,
	JUN_PATH_MAX    = 7,
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
	void (*retro_cheat_reset)();
	void (*retro_cheat_set)(unsigned index, bool enabled, const char *code);
	void (*retro_run)(void);
	void (*retro_reset)(void);
	void (*retro_unload_game)(void);
	void (*retro_deinit)(void);
};

static struct CTX {
	bool initialized;

	char *paths[JUN_PATH_MAX];

	struct retro_game_info game;
	struct retro_system_info system;
	struct retro_system_av_info av;
	enum retro_pixel_format format;

	void *memory;
	size_t memory_size;
	uint64_t last_save;

	bool inputs[UINT8_MAX];

	struct {
		char *key;
		char *name;
		char *options;
		char *value;
	} variables[INT8_MAX];
	bool variables_update;

	struct {
		const void *data;
		uint32_t width;
		uint32_t height;
		uint32_t pitch;
		float ratio;
	} video;

	struct {
		void *data;
		size_t frames;
		size_t max_size;
		bool finalized;
	} audio;

	struct {
		bool pressed;
		int16_t x;
		int16_t y;
	} pointer;

	struct jun_core_sym sym;
} CTX;


static void core_log_params(const char *func, const char *fmt, ...)
{
#if defined(DEBUG)
	va_list args = {0};
	va_start(args, fmt);

	size_t func_len = strlen(func);
	size_t format_len = strlen(fmt);
	char *format = calloc(func_len + format_len + 4, 1);

	memcpy(format, func, func_len);
	memcpy(format + func_len, ": ", 2);
	memcpy(format + func_len + 2, fmt, format_len);

	size_t length = strlen(format);
	if (format[length - 1] != '\n')
		format[length] = '\n';

	vfprintf(stdout, format, args);
	fflush(stdout);

	free(format);
	va_end(args);
#endif
}

static uint64_t core_get_ticks()
{
	struct timespec now = {0};
	clock_gettime(CLOCK_REALTIME, &now);
	return now.tv_sec * 1000.0 + now.tv_nsec / 1000000.0;
}

static char *core_strfmt(const char *fmt, ...)
{
	va_list args;
	va_list args_copy;

	va_start(args, fmt);
	va_copy(args_copy, args);

	size_t size = vsnprintf(NULL, 0, fmt, args_copy) + 1;

	char *str = calloc(size, 1);
	vsnprintf(str, size, fmt, args);

	va_end(args_copy);
	va_end(args);

	return str;
}

static void core_log_cb(enum retro_log_level level, const char *fmt, ...)
{
	va_list args;
	va_start(args, fmt);

	char buffer[4096] = {0};
	vsnprintf(buffer, sizeof(buffer), fmt, args);
	LOG("%s", buffer);

	va_end(args);
}

static bool environment(unsigned cmd, void *data)
{
	unsigned command = cmd & ~RETRO_ENVIRONMENT_EXPERIMENTAL;
	switch (command) {
		case RETRO_ENVIRONMENT_SET_PIXEL_FORMAT: {
			enum retro_pixel_format *format = data;

			CTX.format = *format;

			return true;
		}
		case RETRO_ENVIRONMENT_GET_CAN_DUPE: {
			bool *dupe = data;

			*dupe = true;

			return true;
		}
		case RETRO_ENVIRONMENT_GET_LOG_INTERFACE: {
			struct retro_log_callback *callback = data;

			callback->log = core_log_cb;

			return true;
		}
		case RETRO_ENVIRONMENT_GET_SYSTEM_DIRECTORY: {
			const char **system_directory = data;

			*system_directory = CTX.paths[JUN_PATH_SYSTEM];

			return true;
		}
		case RETRO_ENVIRONMENT_GET_SAVE_DIRECTORY: {
			const char **save_directory = data;

			*save_directory = CTX.paths[JUN_PATH_SAVES];

			return true;
		}
		case RETRO_ENVIRONMENT_GET_VFS_INTERFACE & ~RETRO_ENVIRONMENT_EXPERIMENTAL: {
			struct retro_vfs_interface_info *vfs = data;

			return false;
		}
		case RETRO_ENVIRONMENT_SET_MESSAGE: {
			struct retro_message *message = data;

			LOG("%s", message->msg);

			return true;
		}
		case RETRO_ENVIRONMENT_SET_VARIABLES: {
			const struct retro_variable *variables = data;

			for (int8_t i = 0; i < INT8_MAX; i++) {
				const struct retro_variable *variable = &variables[i];

				if (!variable->key || !variable->value)
					break;

				LOG("SET -> %s: %s", variable->key, variable->value);

				char *value = strdup(variable->value);

				CTX.variables[i].key = strdup(variable->key);

				char *ptr = NULL;
				CTX.variables[i].name = strdup(strtok_r(value, ";", &ptr));
				CTX.variables[i].options = strdup(strtok_r(NULL, ";", &ptr) + 1);

				char *options = strdup(CTX.variables[i].options);
				CTX.variables[i].value = strdup(strtok_r(options, "|", &ptr));
				free(options);

				free(value);
			}

			return true;
		}
		case RETRO_ENVIRONMENT_GET_VARIABLE: {
			struct retro_variable *variable = data;

			for (int8_t i = 0; i < INT8_MAX; i++) {
				if (strcmp(CTX.variables[i].key, variable->key))
					continue;

				variable->value = CTX.variables[i].value;

				break;
			}

			LOG("GET -> %s: %s", variable->key, variable->value);

			return variable->value != NULL;
		}
		case RETRO_ENVIRONMENT_GET_VARIABLE_UPDATE: {
			bool *update = data;

			*update = CTX.variables_update;
			CTX.variables_update = false;

			return true;
		}
		case RETRO_ENVIRONMENT_GET_AUDIO_VIDEO_ENABLE & ~RETRO_ENVIRONMENT_EXPERIMENTAL: {
			int *status = data;

			*status = 0;     // Reset
			*status |= 0b01; // Enable video
			*status |= 0b10; // Enable audio

			return true;
		}
		case RETRO_ENVIRONMENT_SET_GEOMETRY: {
			struct retro_game_geometry *geometry = data;

			CTX.av.geometry = *geometry;

			return false;
		}
		case RETRO_ENVIRONMENT_SET_HW_RENDER: {
			struct retro_hw_render_callback *hw = data;

			hw->get_current_framebuffer = NULL;
			hw->get_proc_address = eglGetProcAddress;

			return true;
		}
		default: {
			LOG("Unhandled command: %d", command);

			return false;
		}
	}
}

static void video_refresh(const void *data, unsigned width, unsigned height, size_t pitch)
{
	if (!data)
		return;

	CTX.video.data = data;
	CTX.video.width = width;
	CTX.video.height = height;
	CTX.video.pitch = (uint32_t) pitch;

	CTX.video.ratio = CTX.av.geometry.aspect_ratio <= 0
		? (float) width / (float) height
		: CTX.av.geometry.aspect_ratio;

}

static size_t audio_sample_batch(const int16_t *data, size_t frames)
{
	if (CTX.audio.finalized) {
		CTX.audio.frames = 0;
		CTX.audio.finalized = false;
	}

	size_t new_size = (CTX.audio.frames + frames) * 2 * sizeof(float);
	if (new_size > CTX.audio.max_size) {
		CTX.audio.data = realloc(CTX.audio.data, new_size);
		CTX.audio.max_size = new_size;
	}

	size_t offset = CTX.audio.frames * 2 * sizeof(float);
	float *converted = &CTX.audio.data[offset];
	for (size_t i = 0; i < frames * 2; i++)
		converted[i] = data[i] / 32768.0f;

	CTX.audio.frames += frames;

	return frames;
}

static void audio_sample(int16_t left, int16_t right)
{
	audio_sample_batch((int16_t[]) { left, right }, 1);
}

static void input_poll()
{
	// NOOP
}

static int16_t input_state(unsigned port, unsigned device, unsigned index, unsigned id)
{
	if (port != 0)
		return 0;

	if (device == RETRO_DEVICE_JOYPAD)
		return CTX.inputs[id];

	if (device == RETRO_DEVICE_POINTER) {
		switch (id) {
			case RETRO_DEVICE_ID_POINTER_PRESSED:
				return CTX.pointer.pressed;
			case RETRO_DEVICE_ID_POINTER_X:
				return (((double) CTX.pointer.x * 0x10000) / (double) CTX.video.width) - 0x8000;
			case RETRO_DEVICE_ID_POINTER_Y:
				return (((double) CTX.pointer.y * 0x10000) / (double) CTX.video.height) - 0x8000;
		}
	}

	return 0;
}

static void save_memory(uint32_t type, const char *path)
{
	void *buffer = CTX.sym.retro_get_memory_data(type);
	if (!buffer)
		return;

	size_t size = CTX.sym.retro_get_memory_size(type);
	if (!size)
		return;

	if (CTX.memory == NULL || CTX.memory_size != size || memcmp(CTX.memory, buffer, size)) {
		FILE *file = fopen(path, "w+");
		fwrite(buffer, 1, size, file);
		fclose(file);

		free(CTX.memory);
		CTX.memory = calloc(size, 1);
		CTX.memory_size = size;
		memcpy(CTX.memory, buffer, size);
	}
}

static void save_memories()
{
	if (core_get_ticks() - CTX.last_save < 1000)
		return;

	CTX.last_save = core_get_ticks();

	const char *sram_path = CTX.paths[JUN_PATH_SRAM];
	const char *rtc_path = CTX.paths[JUN_PATH_RTC];

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

	FILE *file = fopen(path, "r");
	if (!file)
		return;

	fread(buffer, 1, size, file);
	fclose(file);
}

static void restore_memories()
{
	const char *sram_path = CTX.paths[JUN_PATH_SRAM];
	const char *rtc_path = CTX.paths[JUN_PATH_RTC];

	restore_memory(RETRO_MEMORY_SAVE_RAM, sram_path);
	restore_memory(RETRO_MEMORY_RTC, rtc_path);
}

static void initialize_symbols()
{
	if (CTX.sym.initialized)
		return;

	#define MAP_SYMBOL(function) CTX.sym.function = function

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

	#undef MAP_SYMBOL

	CTX.sym.initialized = true;
}

static char *remove_extension(const char *str)
{
	if (!str)
		return NULL;

	char *dot = strrchr(str, '.');
	if (dot == NULL)
		return strdup(str);

	size_t length = (size_t) dot - (size_t) str;
	char *result = calloc(length + 1, 1);
	memcpy(result, str, length);

	return result;
}

static void create_paths(const char *system, const char *rom)
{
	char *game = remove_extension(rom);

	CTX.paths[JUN_PATH_SYSTEM] = core_strfmt("/%s",             system);
	CTX.paths[JUN_PATH_GAME] =   core_strfmt("/%s/%s",          system, rom);
	CTX.paths[JUN_PATH_SAVES] =  core_strfmt("/%s/%s",          system, game);
	CTX.paths[JUN_PATH_STATE] =  core_strfmt("/%s/%s/%s.state", system, game, game);
	CTX.paths[JUN_PATH_SRAM] =   core_strfmt("/%s/%s/%s.srm",   system, game, game);
	CTX.paths[JUN_PATH_RTC] =    core_strfmt("/%s/%s/%s.rtc",   system, game, game);
	CTX.paths[JUN_PATH_CHEATS] = core_strfmt("/%s/%s/%s.cht",   system, game, game);

	free(game);
}

void JUN_CoreCreate(const char *system, const char *rom)
{
	setbuf(stdout, NULL);

	create_paths(system, rom);
	initialize_symbols();

	CTX.sym.retro_set_environment(environment);
	CTX.sym.retro_set_video_refresh(video_refresh);
	CTX.sym.retro_set_input_poll(input_poll);
	CTX.sym.retro_set_input_state(input_state);
	CTX.sym.retro_set_audio_sample(audio_sample);
	CTX.sym.retro_set_audio_sample_batch(audio_sample_batch);
}

bool JUN_CoreStartGame()
{
	CTX.sym.retro_init();
	CTX.sym.retro_get_system_info(&CTX.system);

	CTX.game.path = CTX.paths[JUN_PATH_GAME];

	FILE *file = fopen(CTX.game.path, "r");
	if (file) {
		fseek(file, 0, SEEK_END);
		CTX.game.size = ftell(file);

		if (!CTX.system.need_fullpath) {
			fseek(file, 0, SEEK_SET);
			CTX.game.data = calloc(CTX.game.size, 1);
			fread((void *) CTX.game.data, 1, CTX.game.size, file);
		}

		fclose(file);
	}

	CTX.initialized = CTX.sym.retro_load_game(&CTX.game);

	if (!CTX.initialized)
		return CTX.initialized;

	CTX.sym.retro_get_system_av_info(&CTX.av);
	CTX.sym.retro_set_controller_port_device(0, RETRO_DEVICE_JOYPAD);

	restore_memories();

	return CTX.initialized;
}

void JUN_CoreRun(uint8_t fast_forward)
{
	for (size_t i = 0; i < fast_forward; i++)
		CTX.sym.retro_run();

	CTX.audio.finalized = true;
	save_memories();
}

void JUN_CoreSetInput(uint8_t device, uint8_t id, int16_t value)
{
	if (device == RETRO_DEVICE_JOYPAD)
		CTX.inputs[id] = value;

	if (device == RETRO_DEVICE_POINTER) {
		switch (id) {
			case RETRO_DEVICE_ID_POINTER_PRESSED:
				CTX.pointer.pressed = value;
				break;
			case RETRO_DEVICE_ID_POINTER_X:
				CTX.pointer.x = value;
				break;
			case RETRO_DEVICE_ID_POINTER_Y:
				CTX.pointer.y = value;
				break;
		}
	}
}

void JUN_CoreDestroy()
{
	CTX.sym.retro_deinit();

	for (int8_t i = 0; i < INT8_MAX; i++) {
		if (!CTX.variables[i].key)
			break;

		free(CTX.variables[i].key);
		free(CTX.variables[i].name);
		free(CTX.variables[i].options);
		free(CTX.variables[i].value);
	}

	for (size_t i = 0; i < JUN_PATH_MAX; i++)
		free(CTX.paths[i]);

	free(CTX.memory);
	free((void *) CTX.game.data);

	CTX = (struct CTX) {0};
}

uint32_t JUN_CoreGetPixelFormat()
{
	return CTX.format;
}

uint32_t JUN_CoreGetSampleRate()
{
	return (CTX.av.timing.sample_rate / CTX.av.timing.fps) * 60.0;
}

const void *JUN_CoreGetVideo()
{
	return &CTX.video;
}

const void *JUN_CoreGetAudio()
{
	return &CTX.audio;
}

const void *JUN_CoreGetVariables()
{
	return &CTX.variables;
}

void JUN_CoreSetVariable(const char *key, const char *value)
{
	for (int8_t i = 0; i < INT8_MAX; i++) {
		if (!CTX.variables[i].key)
			break;

		if (strcmp(CTX.variables[i].key, key))
			continue;

		if (strcmp(CTX.variables[i].value, value)) {
			free(CTX.variables[i].value);
			CTX.variables[i].value = strdup(value);
			CTX.variables_update = true;
		}

		break;
	}
}

void JUN_CoreSaveState()
{
	size_t size = CTX.sym.retro_serialize_size();

	void *data = calloc(size, 1);

	CTX.sym.retro_serialize(data, size);

	FILE *file = fopen(CTX.paths[JUN_PATH_STATE], "w+");
	fwrite(data, 1, size, file);
	fclose(file);

	free(data);
}

void JUN_CoreResetCheats()
{
	CTX.sym.retro_cheat_reset();
}

void JUN_CoreSetCheat(uint32_t index, bool enabled, const char *code)
{
	char *value = strdup(code);
	for (size_t i = 0; i < strlen(value); i++)
		if (value[i] == ' ' || value[i] == '\n')
			value[i] = '+';

	CTX.sym.retro_cheat_set(index, enabled, value);

	free(value);
}

void JUN_CoreRestoreState()
{
	size_t size = CTX.sym.retro_serialize_size();
	if (!size)
		return;

	FILE *file = fopen(CTX.paths[JUN_PATH_STATE], "r");
	if (!file)
		return;

	void *buffer = calloc(size, 1);
	fread(buffer, 1, size, file);
	CTX.sym.retro_unserialize(buffer, size);

	free(buffer);
	fclose(file);
}
