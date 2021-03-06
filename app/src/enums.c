#include <string.h>

#include "enums.h"

#include "libretro.h"

#define ENVIRONMENT_MAX 72
#define LANGUAGE_MAX    30
#define JOYPAD_MAX      16
#define KEYBOARD_MAX    64

struct jun_enum_item {
	int32_t value;
	char const *name;
};

struct JUN_Enums {
	struct jun_enum_item environments[ENVIRONMENT_MAX];
	struct jun_enum_item languages[LANGUAGE_MAX];
	struct jun_enum_item joypad[JOYPAD_MAX];
	struct jun_enum_item keyboard[KEYBOARD_MAX];
};

static JUN_Enums *this;

#define register(array, element) \
	(array)[index].value = element; \
	(array)[index].name = #element; \
	index++;

static void register_environments()
{
	size_t index = 0;
	register(this->environments, RETRO_ENVIRONMENT_SET_ROTATION);
	register(this->environments, RETRO_ENVIRONMENT_GET_OVERSCAN);
	register(this->environments, RETRO_ENVIRONMENT_GET_CAN_DUPE);
	register(this->environments, RETRO_ENVIRONMENT_SET_MESSAGE);
	register(this->environments, RETRO_ENVIRONMENT_SHUTDOWN);
	register(this->environments, RETRO_ENVIRONMENT_SET_PERFORMANCE_LEVEL);
	register(this->environments, RETRO_ENVIRONMENT_GET_SYSTEM_DIRECTORY);
	register(this->environments, RETRO_ENVIRONMENT_SET_PIXEL_FORMAT);
	register(this->environments, RETRO_ENVIRONMENT_SET_INPUT_DESCRIPTORS);
	register(this->environments, RETRO_ENVIRONMENT_SET_KEYBOARD_CALLBACK);
	register(this->environments, RETRO_ENVIRONMENT_SET_DISK_CONTROL_INTERFACE);
	register(this->environments, RETRO_ENVIRONMENT_SET_HW_RENDER);
	register(this->environments, RETRO_ENVIRONMENT_GET_VARIABLE);
	register(this->environments, RETRO_ENVIRONMENT_SET_VARIABLES);
	register(this->environments, RETRO_ENVIRONMENT_GET_VARIABLE_UPDATE);
	register(this->environments, RETRO_ENVIRONMENT_SET_SUPPORT_NO_GAME);
	register(this->environments, RETRO_ENVIRONMENT_GET_LIBRETRO_PATH);
	register(this->environments, RETRO_ENVIRONMENT_SET_FRAME_TIME_CALLBACK);
	register(this->environments, RETRO_ENVIRONMENT_SET_AUDIO_CALLBACK);
	register(this->environments, RETRO_ENVIRONMENT_GET_RUMBLE_INTERFACE);
	register(this->environments, RETRO_ENVIRONMENT_GET_INPUT_DEVICE_CAPABILITIES);
	register(this->environments, RETRO_ENVIRONMENT_GET_SENSOR_INTERFACE);
	register(this->environments, RETRO_ENVIRONMENT_GET_CAMERA_INTERFACE);
	register(this->environments, RETRO_ENVIRONMENT_GET_LOG_INTERFACE);
	register(this->environments, RETRO_ENVIRONMENT_GET_PERF_INTERFACE);
	register(this->environments, RETRO_ENVIRONMENT_GET_LOCATION_INTERFACE);
	register(this->environments, RETRO_ENVIRONMENT_GET_CONTENT_DIRECTORY);
	register(this->environments, RETRO_ENVIRONMENT_GET_CORE_ASSETS_DIRECTORY);
	register(this->environments, RETRO_ENVIRONMENT_GET_SAVE_DIRECTORY);
	register(this->environments, RETRO_ENVIRONMENT_SET_SYSTEM_AV_INFO);
	register(this->environments, RETRO_ENVIRONMENT_SET_PROC_ADDRESS_CALLBACK);
	register(this->environments, RETRO_ENVIRONMENT_SET_SUBSYSTEM_INFO);
	register(this->environments, RETRO_ENVIRONMENT_SET_CONTROLLER_INFO);
	register(this->environments, RETRO_ENVIRONMENT_SET_MEMORY_MAPS);
	register(this->environments, RETRO_ENVIRONMENT_SET_GEOMETRY);
	register(this->environments, RETRO_ENVIRONMENT_GET_USERNAME);
	register(this->environments, RETRO_ENVIRONMENT_GET_LANGUAGE);
	register(this->environments, RETRO_ENVIRONMENT_GET_CURRENT_SOFTWARE_FRAMEBUFFER);
	register(this->environments, RETRO_ENVIRONMENT_GET_HW_RENDER_INTERFACE);
	register(this->environments, RETRO_ENVIRONMENT_SET_SUPPORT_ACHIEVEMENTS);
	register(this->environments, RETRO_ENVIRONMENT_SET_HW_RENDER_CONTEXT_NEGOTIATION_INTERFACE);
	register(this->environments, RETRO_ENVIRONMENT_SET_SERIALIZATION_QUIRKS);
	register(this->environments, RETRO_ENVIRONMENT_SET_HW_SHARED_CONTEXT);
	register(this->environments, RETRO_ENVIRONMENT_GET_VFS_INTERFACE);
	register(this->environments, RETRO_ENVIRONMENT_GET_LED_INTERFACE);
	register(this->environments, RETRO_ENVIRONMENT_GET_AUDIO_VIDEO_ENABLE);
	register(this->environments, RETRO_ENVIRONMENT_GET_MIDI_INTERFACE);
	register(this->environments, RETRO_ENVIRONMENT_GET_FASTFORWARDING);
	register(this->environments, RETRO_ENVIRONMENT_GET_TARGET_REFRESH_RATE);
	register(this->environments, RETRO_ENVIRONMENT_GET_INPUT_BITMASKS);
	register(this->environments, RETRO_ENVIRONMENT_GET_CORE_OPTIONS_VERSION);
	register(this->environments, RETRO_ENVIRONMENT_SET_CORE_OPTIONS);
	register(this->environments, RETRO_ENVIRONMENT_SET_CORE_OPTIONS_INTL);
	register(this->environments, RETRO_ENVIRONMENT_SET_CORE_OPTIONS_DISPLAY);
	register(this->environments, RETRO_ENVIRONMENT_GET_PREFERRED_HW_RENDER);
	register(this->environments, RETRO_ENVIRONMENT_GET_DISK_CONTROL_INTERFACE_VERSION);
	register(this->environments, RETRO_ENVIRONMENT_SET_DISK_CONTROL_EXT_INTERFACE);
	register(this->environments, RETRO_ENVIRONMENT_GET_MESSAGE_INTERFACE_VERSION);
	register(this->environments, RETRO_ENVIRONMENT_SET_MESSAGE_EXT);
	register(this->environments, RETRO_ENVIRONMENT_GET_INPUT_MAX_USERS);
	register(this->environments, RETRO_ENVIRONMENT_SET_AUDIO_BUFFER_STATUS_CALLBACK);
	register(this->environments, RETRO_ENVIRONMENT_SET_MINIMUM_AUDIO_LATENCY);
	register(this->environments, RETRO_ENVIRONMENT_SET_FASTFORWARDING_OVERRIDE);
	register(this->environments, RETRO_ENVIRONMENT_SET_CONTENT_INFO_OVERRIDE);
	register(this->environments, RETRO_ENVIRONMENT_GET_GAME_INFO_EXT);
	register(this->environments, RETRO_ENVIRONMENT_SET_CORE_OPTIONS_V2);
	register(this->environments, RETRO_ENVIRONMENT_SET_CORE_OPTIONS_V2_INTL);
	register(this->environments, RETRO_ENVIRONMENT_SET_CORE_OPTIONS_UPDATE_DISPLAY_CALLBACK);
	register(this->environments, RETRO_ENVIRONMENT_SET_VARIABLE);
	register(this->environments, RETRO_ENVIRONMENT_GET_THROTTLE_STATE);
}

static void register_languages()
{
	size_t index = 0;
	register(this->languages, RETRO_LANGUAGE_ENGLISH);
	register(this->languages, RETRO_LANGUAGE_JAPANESE);
	register(this->languages, RETRO_LANGUAGE_FRENCH);
	register(this->languages, RETRO_LANGUAGE_SPANISH);
	register(this->languages, RETRO_LANGUAGE_GERMAN);
	register(this->languages, RETRO_LANGUAGE_ITALIAN);
	register(this->languages, RETRO_LANGUAGE_DUTCH);
	register(this->languages, RETRO_LANGUAGE_PORTUGUESE_BRAZIL);
	register(this->languages, RETRO_LANGUAGE_PORTUGUESE_PORTUGAL);
	register(this->languages, RETRO_LANGUAGE_RUSSIAN);
	register(this->languages, RETRO_LANGUAGE_KOREAN);
	register(this->languages, RETRO_LANGUAGE_CHINESE_TRADITIONAL);
	register(this->languages, RETRO_LANGUAGE_CHINESE_SIMPLIFIED);
	register(this->languages, RETRO_LANGUAGE_ESPERANTO);
	register(this->languages, RETRO_LANGUAGE_POLISH);
	register(this->languages, RETRO_LANGUAGE_VIETNAMESE);
	register(this->languages, RETRO_LANGUAGE_ARABIC);
	register(this->languages, RETRO_LANGUAGE_GREEK);
	register(this->languages, RETRO_LANGUAGE_TURKISH);
	register(this->languages, RETRO_LANGUAGE_SLOVAK);
	register(this->languages, RETRO_LANGUAGE_PERSIAN);
	register(this->languages, RETRO_LANGUAGE_HEBREW);
	register(this->languages, RETRO_LANGUAGE_ASTURIAN);
	register(this->languages, RETRO_LANGUAGE_FINNISH);
	register(this->languages, RETRO_LANGUAGE_INDONESIAN);
	register(this->languages, RETRO_LANGUAGE_SWEDISH);
	register(this->languages, RETRO_LANGUAGE_UKRAINIAN);
	register(this->languages, RETRO_LANGUAGE_CZECH);
	register(this->languages, RETRO_LANGUAGE_CATALAN_VALENCIA);
	register(this->languages, RETRO_LANGUAGE_CATALAN);
}

static void register_joypad()
{
	size_t index = 0;
	register(this->joypad, RETRO_DEVICE_ID_JOYPAD_A);
	register(this->joypad, RETRO_DEVICE_ID_JOYPAD_B);
	register(this->joypad, RETRO_DEVICE_ID_JOYPAD_X);
	register(this->joypad, RETRO_DEVICE_ID_JOYPAD_Y);
	register(this->joypad, RETRO_DEVICE_ID_JOYPAD_L);
	register(this->joypad, RETRO_DEVICE_ID_JOYPAD_R);
	register(this->joypad, RETRO_DEVICE_ID_JOYPAD_UP);
	register(this->joypad, RETRO_DEVICE_ID_JOYPAD_DOWN);
	register(this->joypad, RETRO_DEVICE_ID_JOYPAD_LEFT);
	register(this->joypad, RETRO_DEVICE_ID_JOYPAD_RIGHT);
	register(this->joypad, RETRO_DEVICE_ID_JOYPAD_START);
	register(this->joypad, RETRO_DEVICE_ID_JOYPAD_SELECT);
}

static void register_keyboard()
{
	size_t index = 0;
	register(this->keyboard, MTY_KEY_A);
	register(this->keyboard, MTY_KEY_B);
	register(this->keyboard, MTY_KEY_C);
	register(this->keyboard, MTY_KEY_D);
	register(this->keyboard, MTY_KEY_E);
	register(this->keyboard, MTY_KEY_F);
	register(this->keyboard, MTY_KEY_G);
	register(this->keyboard, MTY_KEY_H);
	register(this->keyboard, MTY_KEY_I);
	register(this->keyboard, MTY_KEY_J);
	register(this->keyboard, MTY_KEY_K);
	register(this->keyboard, MTY_KEY_L);
	register(this->keyboard, MTY_KEY_M);
	register(this->keyboard, MTY_KEY_N);
	register(this->keyboard, MTY_KEY_O);
	register(this->keyboard, MTY_KEY_P);
	register(this->keyboard, MTY_KEY_Q);
	register(this->keyboard, MTY_KEY_R);
	register(this->keyboard, MTY_KEY_S);
	register(this->keyboard, MTY_KEY_T);
	register(this->keyboard, MTY_KEY_U);
	register(this->keyboard, MTY_KEY_V);
	register(this->keyboard, MTY_KEY_W);
	register(this->keyboard, MTY_KEY_X);
	register(this->keyboard, MTY_KEY_Y);
	register(this->keyboard, MTY_KEY_Z);
	register(this->keyboard, MTY_KEY_0);
	register(this->keyboard, MTY_KEY_1);
	register(this->keyboard, MTY_KEY_2);
	register(this->keyboard, MTY_KEY_3);
	register(this->keyboard, MTY_KEY_4);
	register(this->keyboard, MTY_KEY_5);
	register(this->keyboard, MTY_KEY_6);
	register(this->keyboard, MTY_KEY_7);
	register(this->keyboard, MTY_KEY_8);
	register(this->keyboard, MTY_KEY_9);
	register(this->keyboard, MTY_KEY_UP);
	register(this->keyboard, MTY_KEY_DOWN);
	register(this->keyboard, MTY_KEY_LEFT);
	register(this->keyboard, MTY_KEY_RIGHT);
	register(this->keyboard, MTY_KEY_LALT);
	register(this->keyboard, MTY_KEY_RALT);
	register(this->keyboard, MTY_KEY_LBRACKET);
	register(this->keyboard, MTY_KEY_RBRACKET);
	register(this->keyboard, MTY_KEY_LCTRL);
	register(this->keyboard, MTY_KEY_RCTRL);
	register(this->keyboard, MTY_KEY_LSHIFT);
	register(this->keyboard, MTY_KEY_RSHIFT);
	register(this->keyboard, MTY_KEY_BACKSLASH);
	register(this->keyboard, MTY_KEY_BACKSPACE);
	register(this->keyboard, MTY_KEY_COMMA);
	register(this->keyboard, MTY_KEY_DELETE);
	register(this->keyboard, MTY_KEY_END);
	register(this->keyboard, MTY_KEY_ENTER);
	register(this->keyboard, MTY_KEY_EQUALS);
	register(this->keyboard, MTY_KEY_ESCAPE);
	register(this->keyboard, MTY_KEY_GRAVE);
	register(this->keyboard, MTY_KEY_MINUS);
	register(this->keyboard, MTY_KEY_PERIOD);
	register(this->keyboard, MTY_KEY_QUOTE);
	register(this->keyboard, MTY_KEY_SEMICOLON);
	register(this->keyboard, MTY_KEY_SLASH);
	register(this->keyboard, MTY_KEY_SPACE);
	register(this->keyboard, MTY_KEY_TAB);
}

void JUN_EnumsCreate()
{
	this = MTY_Alloc(1, sizeof(JUN_Enums));

	register_environments();
	register_languages();
	register_joypad();
	register_keyboard();
}

static const struct jun_enum_item *get_values(JUN_EnumType type, size_t *size)
{
	switch (type) {
		case JUN_ENUM_ENVIRONMENT:
			*size = ENVIRONMENT_MAX;
			return this->environments;
		case JUN_ENUM_LANGUAGE:
			*size = LANGUAGE_MAX;
			return this->languages;
		case JUN_ENUM_JOYPAD:
			*size = JOYPAD_MAX;
			return this->joypad;
		case JUN_ENUM_KEYBOARD:
			*size = KEYBOARD_MAX;
			return this->keyboard;
		default:
			*size = 0;
			return NULL;
	}
}

MTY_JSON *JUN_EnumsGetAll(JUN_EnumType type)
{
	size_t size = 0;
	const struct jun_enum_item *values = get_values(type, &size);

	MTY_JSON *json = MTY_JSONArrayCreate();

	for (size_t i = 0; i < size; ++i)
		if (values[i].name)
			MTY_JSONArraySetString(json, i, values[i].name);

	return json;
}

uint32_t JUN_EnumsGetInt(JUN_EnumType type, const char *key)
{
	size_t size = 0;
	const struct jun_enum_item *values = get_values(type, &size);

	for (size_t i = 0; i < size; ++i)
		if (!strcmp(values[i].name, key))
			return values[i].value;

	return -1;
}

const char *JUN_EnumsGetString(JUN_EnumType type, uint32_t value)
{
	size_t size = 0;
	const struct jun_enum_item *values = get_values(type, &size);

	for (size_t i = 0; i < size; ++i)
		if (values[i].value == value)
			return values[i].name;

	return NULL;
}

void JUN_EnumsDestroy()
{
	MTY_Free(this);
	this = NULL;
}
