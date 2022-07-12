#include <string.h>

#include "enums.h"
#include "filesystem.h"
#include "interop.h"

#include "core.h"

#define PROTOTYPES(core) \
	void   core ## _retro_init(void); \
	bool   core ## _retro_load_game(const struct retro_game_info *game); \
	void   core ## _retro_get_system_info(struct retro_system_info *info); \
	void   core ## _retro_get_system_av_info(struct retro_system_av_info *info); \
	void   core ## _retro_set_environment(retro_environment_t); \
	void   core ## _retro_set_video_refresh(retro_video_refresh_t); \
	void   core ## _retro_set_input_poll(retro_input_poll_t); \
	void   core ## _retro_set_input_state(retro_input_state_t); \
	void   core ## _retro_set_audio_sample(retro_audio_sample_t); \
	void   core ## _retro_set_audio_sample_batch(retro_audio_sample_batch_t); \
	size_t core ## _retro_get_memory_size(unsigned type); \
	void * core ## _retro_get_memory_data(unsigned type); \
	size_t core ## _retro_serialize_size(void); \
	bool   core ## _retro_serialize(void *data, size_t size); \
	bool   core ## _retro_unserialize(const void *data, size_t size); \
	void   core ## _retro_cheat_reset(void); \
	void   core ## _retro_cheat_set(unsigned index, bool enabled, const char *code); \
	void   core ## _retro_run(void); \
	void   core ## _retro_reset(void); \
	void   core ## _retro_unload_game(void); \
	void   core ## _retro_deinit(void); \
	\
	static bool jun_core_environment_ ## core(unsigned cmd, void *data) \
	{ \
		return jun_core_environment(&CORES.core, cmd, data); \
	}

#define MAP_SYMBOL(core, function) CORES.core.function = core ## _ ## function;

#define MAPPINGS(core) \
	MAP_SYMBOL(core, retro_init); \
	MAP_SYMBOL(core, retro_load_game); \
	MAP_SYMBOL(core, retro_get_system_info); \
	MAP_SYMBOL(core, retro_get_system_av_info); \
	MAP_SYMBOL(core, retro_set_environment); \
	MAP_SYMBOL(core, retro_set_video_refresh); \
	MAP_SYMBOL(core, retro_set_input_poll); \
	MAP_SYMBOL(core, retro_set_input_state); \
	MAP_SYMBOL(core, retro_set_audio_sample); \
	MAP_SYMBOL(core, retro_set_audio_sample_batch); \
	MAP_SYMBOL(core, retro_get_memory_size); \
	MAP_SYMBOL(core, retro_get_memory_data); \
	MAP_SYMBOL(core, retro_serialize_size); \
	MAP_SYMBOL(core, retro_serialize); \
	MAP_SYMBOL(core, retro_unserialize); \
	MAP_SYMBOL(core, retro_cheat_reset); \
	MAP_SYMBOL(core, retro_cheat_set); \
	MAP_SYMBOL(core, retro_run); \
	MAP_SYMBOL(core, retro_reset); \
	MAP_SYMBOL(core, retro_unload_game); \
	MAP_SYMBOL(core, retro_deinit); \
	\
	CORES.core.retro_set_environment(jun_core_environment_ ## core); \
	CORES.core.retro_init(); \
	CORES.core.retro_deinit();

struct jun_core_sym {
	MTY_JSON *configuration;

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

struct {
	bool initialized;

	struct jun_core_sym genesis;
	struct jun_core_sym melonds;
	struct jun_core_sym mgba;
	struct jun_core_sym quicknes;
	struct jun_core_sym snes9x;
} CORES;

struct JUN_Core {
	void *handle;
	bool initialized;

	MTY_Hash *paths;

	MTY_Time last_save;

	JUN_Configuration *configuration;

	struct retro_game_info game;
	struct retro_system_info system;
	struct retro_system_av_info av;

	struct jun_core_sym *sym;
};

static bool jun_core_environment(struct jun_core_sym *sym, unsigned cmd, void *data)
{
	unsigned command = cmd & ~RETRO_ENVIRONMENT_EXPERIMENTAL;
	if (command != RETRO_ENVIRONMENT_SET_VARIABLES)
		return false;

	sym->configuration = MTY_JSONArrayCreate();

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
		MTY_JSON *options = MTY_JSONArrayCreate();
		while (element) {
			MTY_JSONArraySetString(options, i_option, element);
			element = MTY_Strtok(NULL, "|", &ptr);
			i_option++;
		}
		MTY_JSONObjSetItem(item, "options", options);

		MTY_JSONArraySetItem(sym->configuration, i_entry, item);

		MTY_Free(value);
	}

	return true;
}

PROTOTYPES(genesis);
PROTOTYPES(melonds);
PROTOTYPES(mgba);
PROTOTYPES(quicknes);
PROTOTYPES(snes9x);

MTY_JSON *configurations = NULL;
static void jun_core_initialize()
{
	if (CORES.initialized)
		return;

	MAPPINGS(genesis);
	MAPPINGS(melonds);
	MAPPINGS(mgba);
	MAPPINGS(quicknes);
	MAPPINGS(snes9x);

	configurations = MTY_JSONObjCreate();
	MTY_JSONObjSetItem(configurations, "Genesis Plus GX", CORES.genesis.configuration);
	MTY_JSONObjSetItem(configurations, "melonDS", CORES.melonds.configuration);
	MTY_JSONObjSetItem(configurations, "mGBA", CORES.mgba.configuration);
	MTY_JSONObjSetItem(configurations, "QuickNES", CORES.quicknes.configuration);
	MTY_JSONObjSetItem(configurations, "Snes9x", CORES.snes9x.configuration);

	CORES.initialized = true;
}

JUN_Core *JUN_CoreCreate(JUN_CoreType type, MTY_Hash *paths)
{
	JUN_Core *this = MTY_Alloc(1, sizeof(JUN_Core));

	this->configuration = JUN_ConfigurationCreate();

	this->paths = paths;

	jun_core_initialize();

	this->sym = 
		type == JUN_CORE_GENESIS  ? &CORES.genesis  :
		type == JUN_CORE_MELONDS  ? &CORES.melonds  :
		type == JUN_CORE_MGBA     ? &CORES.mgba     :
		type == JUN_CORE_QUICKNES ? &CORES.quicknes :
		type == JUN_CORE_SNES9X   ? &CORES.snes9x   :
		NULL;

	return this;
}

const MTY_JSON *JUN_CoreGetDefaultConfiguration()
{
	jun_core_initialize();

	return configurations;
}

JUN_Configuration *JUN_CoreGetConfiguration(JUN_Core *this)
{
	return this->configuration;
}

void JUN_CoreSetCallbacks(JUN_Core *this, JUN_CoreCallbacks *callbacks)
{
	this->sym->retro_set_environment(callbacks->environment);
	this->sym->retro_set_video_refresh(callbacks->video_refresh);
	this->sym->retro_set_input_poll(callbacks->input_poll);
	this->sym->retro_set_input_state(callbacks->input_state);
	this->sym->retro_set_audio_sample(callbacks->audio_sample);
	this->sym->retro_set_audio_sample_batch(callbacks->audio_sample_batch);
}

double JUN_CoreGetSampleRate(JUN_Core *this)
{
	return this->av.timing.sample_rate;
}

double JUN_CoreGetFramesPerSecond(JUN_Core *this)
{
	return this->av.timing.fps;
}

bool JUN_CoreStartGame(JUN_Core *this)
{
	this->sym->retro_init();

	this->sym->retro_get_system_info(&this->system);

	const char *game_path = MTY_HashGetInt(this->paths, JUN_FILE_GAME);
	JUN_File *game = JUN_FilesystemGetExistingFile(game_path);

	this->game.path = game->path;
	this->game.size = game->size;
	if (!this->system.need_fullpath) {
		this->game.data = MTY_Alloc(this->game.size, 1);
		memcpy((void *) this->game.data, game->buffer, this->game.size);
	}

	this->initialized = this->sym->retro_load_game(&this->game);

	this->sym->retro_get_system_av_info(&this->av);

	return this->initialized;
}

bool JUN_CoreHasStarted(JUN_Core *this)
{
	return this && this->initialized;
}

void JUN_CoreRun(JUN_Core *this, size_t count)
{
	for (int i = 0; i < count; ++i)
		this->sym->retro_run();
}

void save_memory(JUN_Core *this, uint32_t type, const char *path)
{
	void *buffer = this->sym->retro_get_memory_data(type);
	if (!buffer)
		return;

	size_t size = this->sym->retro_get_memory_size(type);
	if (!size)
		return;

	JUN_FilesystemSaveFile(path, buffer, size);
}

void JUN_CoreSaveMemories(JUN_Core *this)
{
	if (MTY_TimeDiff(this->last_save, MTY_GetTime()) < 1000)
		return;

	this->last_save = MTY_GetTime();

	const char *sram_path = MTY_HashGetInt(this->paths, JUN_FILE_SRAM);
	const char *rtc_path = MTY_HashGetInt(this->paths, JUN_FILE_RTC);

	save_memory(this, RETRO_MEMORY_SAVE_RAM, sram_path);
	save_memory(this, RETRO_MEMORY_RTC, rtc_path);
}

static void restore_memory(JUN_Core *this, uint32_t type, const char *path)
{
	void *buffer = this->sym->retro_get_memory_data(type);
	if (!buffer)
		return;

	size_t size = this->sym->retro_get_memory_size(type);
	if (!size)
		return;

	JUN_File *file = JUN_FilesystemGetExistingFile(path);
	if (!file)
		return;

	memcpy(buffer, file->buffer, file->size);
}

void JUN_CoreRestoreMemories(JUN_Core *this)
{
	const char *sram_path = MTY_HashGetInt(this->paths, JUN_FILE_SRAM);
	const char *rtc_path = MTY_HashGetInt(this->paths, JUN_FILE_RTC);

	restore_memory(this, RETRO_MEMORY_SAVE_RAM, sram_path);
	restore_memory(this, RETRO_MEMORY_RTC, rtc_path);
}

void JUN_CoreSetCheats(JUN_Core *this)
{
	char *path = NULL;
	size_t index = 0;

	const char *cheats_path = MTY_HashGetInt(this->paths, JUN_FOLDER_CHEATS);

	while (JUN_InteropReadDir(cheats_path, index++, &path)) {
		void *cheat = JUN_InteropReadFile(path, NULL);
		MTY_JSON *json = MTY_JSONParse(cheat);

		bool enabled = false;
		MTY_JSONObjGetBool(json, "enabled", &enabled);
		if (!enabled)
			continue;

		uint32_t order = 0;
		MTY_JSONObjGetUInt(json, "order", &order);

		char value[1024] = {0};
		MTY_JSONObjGetString(json, "value", value, 1024);
		for (size_t i = 0; i < strlen(value); i++) {
			if (value[i] == ' ' || value[i] == '\n')
				value[i] = '+';
		}

		this->sym->retro_cheat_set(order, enabled, value);

		MTY_JSONDestroy(&json);
	}
}

void JUN_CoreResetCheats(JUN_Core *this)
{
	this->sym->retro_cheat_reset();
}

void JUN_CoreSaveState(JUN_Core *this)
{
	size_t size = this->sym->retro_serialize_size();

	void *data = MTY_Alloc(size, 1);

	this->sym->retro_serialize(data, size);

	const char *state_path = MTY_HashGetInt(this->paths, JUN_FILE_STATE);
	JUN_FilesystemSaveFile(state_path, data, size);

	MTY_Free(data);
}

void JUN_CoreRestoreState(JUN_Core *this)
{
	size_t size = this->sym->retro_serialize_size();

	const char *state_path = MTY_HashGetInt(this->paths, JUN_FILE_STATE);
	JUN_File *file = JUN_FilesystemGetExistingFile(state_path);
	if (!file)
		return;

	this->sym->retro_unserialize(file->buffer, size);
}

void JUN_CoreDestroy(JUN_Core **core)
{
	if (!core || !*core)
		return;

	JUN_Core *this = *core;

	JUN_ConfigurationDestroy(&this->configuration);

	this->sym->retro_unload_game();
	this->sym->retro_deinit();

	if (this->game.data)
		MTY_Free((void *) this->game.data);

	MTY_Free(this);
	*core = NULL;
}
