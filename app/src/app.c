#include <stdio.h>

#include "enums.h"
#include "filesystem.h"
#include "settings.h"
#include "interop.h"
#include "toolbox.h"

#include "app.h"

typedef struct _JUN_App _JUN_App;

struct _JUN_App
{
	JUN_App public;

	const char *core_name;
	char *game_path;

	uint32_t language;

	struct
	{
		char *assets;
		char *system;
		char *save;
		char *games;
		char *cheats;
	} directories;
};

MTY_Hash *core_names = NULL;
static const char *jun_core_get_name(const char *system)
{
	if (!core_names) {
		core_names = MTY_HashCreate(0);

		MTY_HashSet(core_names, "NES",              "QuickNES");
		MTY_HashSet(core_names, "SNES",             "Snes9x");
		MTY_HashSet(core_names, "Master System",    "Genesis Plus GX");
		MTY_HashSet(core_names, "Mega Drive",       "Genesis Plus GX");
		MTY_HashSet(core_names, "Game Boy",         "mGBA");
		MTY_HashSet(core_names, "Game Boy Color",   "mGBA");
		MTY_HashSet(core_names, "Game Boy Advance", "mGBA");
		MTY_HashSet(core_names, "Nintendo DS",      "melonDS");
	}

	return MTY_HashGet(core_names, system);
}

MTY_Hash *core_types = NULL;
static JUN_CoreType jun_core_get_type(const char *system)
{
	if (!core_types) {
		core_types = MTY_HashCreate(0);

		MTY_HashSet(core_types, "NES",              (void *) JUN_CORE_QUICKNES);
		MTY_HashSet(core_types, "SNES",             (void *) JUN_CORE_SNES9X);
		MTY_HashSet(core_types, "Master System",    (void *) JUN_CORE_GENESIS);
		MTY_HashSet(core_types, "Mega Drive",       (void *) JUN_CORE_GENESIS);
		MTY_HashSet(core_types, "Game Boy",         (void *) JUN_CORE_MGBA);
		MTY_HashSet(core_types, "Game Boy Color",   (void *) JUN_CORE_MGBA);
		MTY_HashSet(core_types, "Game Boy Advance", (void *) JUN_CORE_MGBA);
		MTY_HashSet(core_types, "Nintendo DS",      (void *) JUN_CORE_MELONDS);
	}

	return (JUN_CoreType) MTY_HashGet(core_types, system);
}

static void jun_app_configure(_JUN_App *this)
{
	char *json = JUN_InteropReadFile("/assets/settings.json", NULL);

	uint64_t iter;
	const char *key;

	// Initialize settings instance
	JUN_Settings *settings = JUN_SettingsInitialize(json, this->core_name);

	// Set prefered language
	char *language = MTY_SprintfD("RETRO_LANGUAGE_%s", settings->language);
	this->language = JUN_EnumsGetInt(JUN_ENUM_LANGUAGE, language);
	MTY_Free(language);

	// Set keyboard bindings
	iter = 0;
	key = NULL;
	while (MTY_HashGetNextKey(settings->bindings, &iter, &key))
	{
		char *value = MTY_HashGet(settings->bindings, key);
		JUN_InputSetBinding(this->public.input, key, value);
	}

	// Set custom configurations
	iter = 0;
	key = NULL;
	JUN_Configuration *configuration = JUN_CoreGetConfiguration(this->public.core);
	while (MTY_HashGetNextKey(settings->configurations, &iter, &key))
	{
		char *value = MTY_HashGet(settings->configurations, key);
		JUN_ConfigurationOverride(configuration, key, value);
	}

	// Destroy settings instance
	JUN_SettingsDestroy(&settings);

	// Store game data
	size_t game_size = 0;
	void *game = JUN_InteropReadFile(this->game_path, &game_size);
	JUN_VfsSaveFile(this->game_path, game, game_size);
	MTY_Free(game);

	MTY_Free(json);
}

JUN_App *JUN_AppInitialize(MTY_AppFunc app_func, MTY_EventFunc event_func)
{
	_JUN_App *this = MTY_Alloc(1, sizeof(_JUN_App));

	char *system_name = JUN_InteropGetSystem();
	char *game_name = JUN_InteropGetGame();

	this->core_name = jun_core_get_name(system_name);

	this->directories.assets = MTY_Strdup("/assets");
	this->directories.system = MTY_SprintfD("/system/%s", this->core_name);
	this->directories.save   = MTY_SprintfD("/save/%s", system_name);
	this->directories.games  = MTY_SprintfD("/games/%s", system_name);
	this->directories.cheats = MTY_SprintfD("/cheats/%s", system_name);

	char *state_name = JUN_ToolboxReplaceExtension(game_name, "state");
	char *state_path = MTY_SprintfD("%s/%s", this->directories.save, state_name);
	MTY_Free(state_name);

	char *sram_name = JUN_ToolboxReplaceExtension(game_name, "srm");
	char *sram_path = MTY_SprintfD("%s/%s", this->directories.save, sram_name);
	MTY_Free(sram_name);

	char *rtc_name = JUN_ToolboxReplaceExtension(game_name, "rtc");
	char *rtc_path = MTY_SprintfD("%s/%s", this->directories.save, rtc_name);
	MTY_Free(rtc_name);

	char *cheat_path = MTY_SprintfD("%s/%s/", this->directories.cheats, game_name);

	this->game_path = MTY_SprintfD("%s/%s", this->directories.games, game_name);

	JUN_CoreType type = jun_core_get_type(system_name);

	this->public.core = JUN_CoreInitialize(type, this->game_path, state_path, sram_path, rtc_path, cheat_path);
	this->public.state = JUN_StateInitialize();
	this->public.input = JUN_InputInitialize(this->public.state);
	this->public.audio = JUN_AudioInitialize();
	this->public.video = JUN_VideoInitialize(this->public.state, app_func, event_func);

	jun_app_configure(this);

	MTY_Free(cheat_path);
	MTY_Free(rtc_path);
	MTY_Free(sram_path);
	MTY_Free(state_path);
	MTY_Free(game_name);
	MTY_Free(system_name);

	return (JUN_App *) this;
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

bool JUN_AppEnvironment(JUN_App *public, unsigned cmd, void *data)
{
	_JUN_App *this = (_JUN_App *)public;

	unsigned command = cmd & ~RETRO_ENVIRONMENT_EXPERIMENTAL;
	switch (command)
	{
	case RETRO_ENVIRONMENT_SET_PIXEL_FORMAT:
	{
		return JUN_VideoSetPixelFormat(this->public.video, data);
	}
	case RETRO_ENVIRONMENT_GET_LOG_INTERFACE:
	{
		struct retro_log_callback *callback = data;

		callback->log = core_log;

		return true;
	}
	case RETRO_ENVIRONMENT_GET_LANGUAGE:
	{
		unsigned *language = data;

		*language = this->language;

		return true;
	}
	case RETRO_ENVIRONMENT_GET_SYSTEM_DIRECTORY:
	{
		char **system_directory = data;

		*system_directory = this->directories.system;

		return true;
	}
	case RETRO_ENVIRONMENT_GET_SAVE_DIRECTORY:
	{
		char **save_directory = data;

		*save_directory = this->directories.save;

		return true;
	}
	case RETRO_ENVIRONMENT_GET_VFS_INTERFACE & ~RETRO_ENVIRONMENT_EXPERIMENTAL:
	{
		struct retro_vfs_interface_info *vfs = data;

		vfs->iface = JUN_VfsGetInterface();
		vfs->required_interface_version = JUN_VfsGetInterfaceVersion();

		return true;
	}
	case RETRO_ENVIRONMENT_SET_MESSAGE:
	{
		struct retro_message *message = data;

		MTY_Log("%s", message->msg);

		return true;
	}
	case RETRO_ENVIRONMENT_SET_VARIABLES:
	{
		const struct retro_variable *variables = data;

		JUN_Configuration *configuration = JUN_CoreGetConfiguration(this->public.core);

		for (uint32_t x = 0; x < UINT32_MAX; x++)
		{
			const struct retro_variable *variable = &variables[x];

			if (!variable->key || !variable->value)
				break;

			JUN_ConfigurationSet(configuration, variable->key, variable->value);

			MTY_Log("SET -> %s: %s", variable->key, variable->value);
		}

		return true;
	}
	case RETRO_ENVIRONMENT_GET_VARIABLE:
	{
		struct retro_variable *variable = data;

		JUN_Configuration *configuration = JUN_CoreGetConfiguration(this->public.core);
		variable->value = JUN_ConfigurationGet(configuration, variable->key);

		MTY_Log("GET -> %s: %s", variable->key, variable->value);

		return variable->value != NULL;
	}
	case RETRO_ENVIRONMENT_GET_VARIABLE_UPDATE:
	{
		bool *update = data;

		*update = false;

		return true;
	}
	case RETRO_ENVIRONMENT_GET_AUDIO_VIDEO_ENABLE & ~RETRO_ENVIRONMENT_EXPERIMENTAL:
	{
		int *status = data;

		*status = 0;		 // Reset
		*status |= 0b01; // Enable video
		*status |= 0b10; // Enable audio

		return true;
	}
	default:
	{
		const char *name = JUN_EnumsGetString(JUN_ENUM_ENVIRONMENT, cmd);

		MTY_Log("Unhandled command: %s (%d)", name, command);

		return false;
	}
	}
}

void JUN_AppDestroy(JUN_App **public)
{
	_JUN_App **this = (_JUN_App **)public;

	MTY_Free((*this)->game_path);

	MTY_Free((*this)->directories.assets);
	MTY_Free((*this)->directories.system);
	MTY_Free((*this)->directories.save);
	MTY_Free((*this)->directories.games);

	JUN_CoreDestroy(&(*this)->public.core);
	JUN_StateDestroy(&(*this)->public.state);
	JUN_InputDestroy(&(*this)->public.input);
	JUN_AudioDestroy(&(*this)->public.audio);
	JUN_VideoDestroy(&(*this)->public.video);

	MTY_Free(*this);
	*this = NULL;
}
