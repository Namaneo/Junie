#include <stdio.h>

#include "filesystem.h"
#include "interop.h"

#include "app.h"

JUN_App *JUN_AppCreate(MTY_EventFunc event)
{
	JUN_App *this = MTY_Alloc(1, sizeof(JUN_App));

	this->state = JUN_StateCreate();
	this->input = JUN_InputCreate(this->state);
	this->audio = JUN_AudioCreate(this->state);
	this->video = JUN_VideoCreate(this->state, this->input, event);

	return (JUN_App *) this;
}

static void jun_app_configure(JUN_App *this, const char *system, const char *json)
{
	MTY_JSON *settings = MTY_JSONParse(json);
	JUN_Configuration *configuration = JUN_CoreGetConfiguration();

	uint64_t iter = 0;
	const char *key = NULL;
	while (MTY_JSONObjGetNextKey(settings, &iter, &key)) {
		const char *value = MTY_JSONObjGetStringPtr(settings, key);
		JUN_ConfigurationOverride(configuration, key, value);
	}

	MTY_JSONDestroy(&settings);
}

void JUN_AppLoadCore(JUN_App *this, const char *system, const char *rom, const char *settings)
{
	JUN_CoreCreate(system, rom);
	jun_app_configure(this, system, settings);
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

bool JUN_AppEnvironment(JUN_App *this, unsigned cmd, void *data)
{
	unsigned command = cmd & ~RETRO_ENVIRONMENT_EXPERIMENTAL;
	switch (command) {
		case RETRO_ENVIRONMENT_SET_PIXEL_FORMAT: {
			return JUN_VideoSetPixelFormat(this->video, data);
		}
		case RETRO_ENVIRONMENT_GET_LOG_INTERFACE: {
			struct retro_log_callback *callback = data;

			callback->log = core_log;

			return true;
		}
		case RETRO_ENVIRONMENT_GET_SYSTEM_DIRECTORY: {
			const char **system_directory = data;

			*system_directory = JUN_CoreGetSystemPath();

			return true;
		}
		case RETRO_ENVIRONMENT_GET_SAVE_DIRECTORY: {
			const char **save_directory = data;

			*save_directory = JUN_CoreGetSavesPath();

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

			JUN_Configuration *configuration = JUN_CoreGetConfiguration();

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

			JUN_Configuration *configuration = JUN_CoreGetConfiguration();
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
			MTY_Log("Unhandled command: %d", command);

			return false;
		}
	}
}

void JUN_AppDestroy(JUN_App **app)
{
	if (!app || !*app)
		return;

	JUN_App *this = *app;

	JUN_CoreDestroy();
	JUN_VideoDestroy(&this->video);
	JUN_AudioDestroy(&this->audio);
	JUN_InputDestroy(&this->input);
	JUN_StateDestroy(&this->state);

	MTY_Free(this);
	*app = NULL;
}
