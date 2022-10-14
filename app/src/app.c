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

	uint32_t language;
	MTY_Hash *paths;
};

static MTY_Hash *core_types = NULL;
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

	return (JUN_CoreType) (uint64_t) MTY_HashGet(core_types, system);
}

JUN_App *JUN_AppCreate(MTY_AppFunc app_func, MTY_EventFunc event_func)
{
	_JUN_App *this = MTY_Alloc(1, sizeof(_JUN_App));

	this->public.state = JUN_StateCreate();
	this->public.input = JUN_InputCreate(this->public.state);
	this->public.audio = JUN_AudioCreate(this->public.state);
	this->public.video = JUN_VideoCreate(this->public.state, this->public.input, app_func, event_func);

	return (JUN_App *) this;
}

static void jun_app_configure(_JUN_App *this, const char *system, const MTY_JSON *json)
{
	uint64_t iter;
	const char *key;

	// Initialize settings instance
	JUN_Settings *settings = JUN_SettingsCreate(json);

	// Set prefered language
	this->language = JUN_EnumsGetInt(JUN_ENUM_LANGUAGE, settings->language);

	// Set keyboard bindings
	iter = 0;
	key = NULL;
	while (MTY_HashGetNextKey(settings->bindings, &iter, &key)) {
		const char *value = MTY_HashGet(settings->bindings, key);
		uint32_t joypad = JUN_EnumsGetInt(JUN_ENUM_JOYPAD, key);
		uint32_t keyboard = JUN_EnumsGetInt(JUN_ENUM_KEYBOARD, value);
		JUN_InputMapKey(this->public.input, joypad, keyboard);
	}

	// Set custom configurations
	iter = 0;
	key = NULL;
	JUN_Configuration *configuration = JUN_CoreGetConfiguration(this->public.core);
	while (MTY_HashGetNextKey(settings->configurations, &iter, &key)) {
		char *value = MTY_HashGet(settings->configurations, key);
		JUN_ConfigurationOverride(configuration, key, value);
	}

	// Destroy settings instance
	JUN_SettingsDestroy(&settings);
}

void JUN_AppLoadCore(JUN_App *public, const char *system, const char *rom, const MTY_JSON *settings)
{
	_JUN_App *this = (_JUN_App *) public;

	char *game = JUN_ToolboxRemoveExtension(rom);

	this->paths = MTY_HashCreate(0);

	MTY_HashSetInt(this->paths, JUN_FILE_GAME,  MTY_SprintfD("/games/%s/%s", system, rom));
	MTY_HashSetInt(this->paths, JUN_FILE_STATE, MTY_SprintfD("/saves/%s/%s.state", system, game));
	MTY_HashSetInt(this->paths, JUN_FILE_SRAM,  MTY_SprintfD("/saves/%s/%s.srm", system, game));
	MTY_HashSetInt(this->paths, JUN_FILE_RTC,   MTY_SprintfD("/saves/%s/%s.rtc", system, game));

	MTY_HashSetInt(this->paths, JUN_FOLDER_SAVES,  MTY_SprintfD("/saves/%s", system));
	MTY_HashSetInt(this->paths, JUN_FOLDER_SYSTEM, MTY_SprintfD("/systems/%s", system));
	MTY_HashSetInt(this->paths, JUN_FOLDER_CHEATS, MTY_SprintfD("/cheats/%s/%s", system, rom));

	JUN_CoreType type = jun_core_get_type(system);
	this->public.core = JUN_CoreCreate(type, this->paths);

	jun_app_configure(this, system, settings);

	MTY_Free(game);
}

const char *JUN_AppGetPath(JUN_App *public, JUN_PathType type)
{
	_JUN_App *this = (_JUN_App *) public;

	return MTY_HashGetInt(this->paths, type);
}

void JUN_AppUnloadCore(JUN_App *public)
{
	_JUN_App *this = (_JUN_App *) public;

	if (!this->public.core)
		return;

	JUN_CoreDestroy(&this->public.core);
	MTY_HashDestroy(&this->paths, MTY_Free);
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
	_JUN_App *this = (_JUN_App *) public;

	unsigned command = cmd & ~RETRO_ENVIRONMENT_EXPERIMENTAL;
	switch (command) {
		case RETRO_ENVIRONMENT_SET_PIXEL_FORMAT: {
			return JUN_VideoSetPixelFormat(this->public.video, data);
		}
		case RETRO_ENVIRONMENT_GET_LOG_INTERFACE: {
			struct retro_log_callback *callback = data;

			callback->log = core_log;

			return true;
		}
		case RETRO_ENVIRONMENT_GET_LANGUAGE: {
			unsigned *language = data;

			*language = this->language;

			return true;
		}
		case RETRO_ENVIRONMENT_GET_SYSTEM_DIRECTORY: {
			char **system_directory = data;

			*system_directory = MTY_HashGetInt(this->paths, JUN_FOLDER_SYSTEM);

			return true;
		}
		case RETRO_ENVIRONMENT_GET_SAVE_DIRECTORY: {
			char **save_directory = data;

			*save_directory = MTY_HashGetInt(this->paths, JUN_FOLDER_SAVES);

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
		case RETRO_ENVIRONMENT_GET_VARIABLE: {
			struct retro_variable *variable = data;

			JUN_Configuration *configuration = JUN_CoreGetConfiguration(this->public.core);
			variable->value = JUN_ConfigurationGet(configuration, variable->key);

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
			const char *name = JUN_EnumsGetString(JUN_ENUM_ENVIRONMENT, cmd);

			MTY_Log("Unhandled command: %s (%d)", name, command);

			return false;
		}
	}
}

void JUN_AppDestroy(JUN_App **public)
{
	if (!public || !*public)
		return;

	_JUN_App *this = * (_JUN_App **) public;

	if (this->public.core)
		JUN_CoreDestroy(&this->public.core);

	if (this->public.video)
		JUN_VideoDestroy(&this->public.video);

	if (this->public.audio)
		JUN_AudioDestroy(&this->public.audio);

	if (this->public.input)
		JUN_InputDestroy(&this->public.input);

	if (this->public.state)
		JUN_StateDestroy(&this->public.state);

	if (this->paths)
		MTY_HashDestroy(&this->paths, MTY_Free);

	MTY_Free(this);
	*public = NULL;
}
