#include "enums.h"

#include "libretro.h"

struct JUN_Enums
{
    MTY_Hash *environments;
    MTY_Hash *languages;
    MTY_Hash *joypad;
    MTY_Hash *keyboard;
};

static JUN_Enums *this;

#define register_environment(this, env)   MTY_HashSet(this->environments, #env, (void *)env)
#define register_language(this, language) MTY_HashSet(this->languages, #language, (void *)language)
#define register_joypad_key(this, key)    MTY_HashSet(this->joypad, #key, (void *)key)
#define register_keyboard_key(this, key)  MTY_HashSet(this->keyboard, #key, (void *)key)

static void register_environments()
{
    this->environments = MTY_HashCreate(0);
    register_environment(this, RETRO_ENVIRONMENT_SET_ROTATION);
    register_environment(this, RETRO_ENVIRONMENT_GET_OVERSCAN);
    register_environment(this, RETRO_ENVIRONMENT_GET_CAN_DUPE);
    register_environment(this, RETRO_ENVIRONMENT_SET_MESSAGE);
    register_environment(this, RETRO_ENVIRONMENT_SHUTDOWN);
    register_environment(this, RETRO_ENVIRONMENT_SET_PERFORMANCE_LEVEL);
    register_environment(this, RETRO_ENVIRONMENT_GET_SYSTEM_DIRECTORY);
    register_environment(this, RETRO_ENVIRONMENT_SET_PIXEL_FORMAT);
    register_environment(this, RETRO_ENVIRONMENT_SET_INPUT_DESCRIPTORS);
    register_environment(this, RETRO_ENVIRONMENT_SET_KEYBOARD_CALLBACK);
    register_environment(this, RETRO_ENVIRONMENT_SET_DISK_CONTROL_INTERFACE);
    register_environment(this, RETRO_ENVIRONMENT_SET_HW_RENDER);
    register_environment(this, RETRO_ENVIRONMENT_GET_VARIABLE);
    register_environment(this, RETRO_ENVIRONMENT_SET_VARIABLES);
    register_environment(this, RETRO_ENVIRONMENT_GET_VARIABLE_UPDATE);
    register_environment(this, RETRO_ENVIRONMENT_SET_SUPPORT_NO_GAME);
    register_environment(this, RETRO_ENVIRONMENT_GET_LIBRETRO_PATH);
    register_environment(this, RETRO_ENVIRONMENT_SET_FRAME_TIME_CALLBACK);
    register_environment(this, RETRO_ENVIRONMENT_SET_AUDIO_CALLBACK);
    register_environment(this, RETRO_ENVIRONMENT_GET_RUMBLE_INTERFACE);
    register_environment(this, RETRO_ENVIRONMENT_GET_INPUT_DEVICE_CAPABILITIES);
    register_environment(this, RETRO_ENVIRONMENT_GET_SENSOR_INTERFACE);
    register_environment(this, RETRO_ENVIRONMENT_GET_CAMERA_INTERFACE);
    register_environment(this, RETRO_ENVIRONMENT_GET_LOG_INTERFACE);
    register_environment(this, RETRO_ENVIRONMENT_GET_PERF_INTERFACE);
    register_environment(this, RETRO_ENVIRONMENT_GET_LOCATION_INTERFACE);
    register_environment(this, RETRO_ENVIRONMENT_GET_CONTENT_DIRECTORY);
    register_environment(this, RETRO_ENVIRONMENT_GET_CORE_ASSETS_DIRECTORY);
    register_environment(this, RETRO_ENVIRONMENT_GET_SAVE_DIRECTORY);
    register_environment(this, RETRO_ENVIRONMENT_SET_SYSTEM_AV_INFO);
    register_environment(this, RETRO_ENVIRONMENT_SET_PROC_ADDRESS_CALLBACK);
    register_environment(this, RETRO_ENVIRONMENT_SET_SUBSYSTEM_INFO);
    register_environment(this, RETRO_ENVIRONMENT_SET_CONTROLLER_INFO);
    register_environment(this, RETRO_ENVIRONMENT_SET_MEMORY_MAPS);
    register_environment(this, RETRO_ENVIRONMENT_SET_GEOMETRY);
    register_environment(this, RETRO_ENVIRONMENT_GET_USERNAME);
    register_environment(this, RETRO_ENVIRONMENT_GET_LANGUAGE);
    register_environment(this, RETRO_ENVIRONMENT_GET_CURRENT_SOFTWARE_FRAMEBUFFER);
    register_environment(this, RETRO_ENVIRONMENT_GET_HW_RENDER_INTERFACE);
    register_environment(this, RETRO_ENVIRONMENT_SET_SUPPORT_ACHIEVEMENTS);
    register_environment(this, RETRO_ENVIRONMENT_SET_HW_RENDER_CONTEXT_NEGOTIATION_INTERFACE);
    register_environment(this, RETRO_ENVIRONMENT_SET_SERIALIZATION_QUIRKS);
    register_environment(this, RETRO_ENVIRONMENT_SET_HW_SHARED_CONTEXT);
    register_environment(this, RETRO_ENVIRONMENT_GET_VFS_INTERFACE);
    register_environment(this, RETRO_ENVIRONMENT_GET_LED_INTERFACE);
    register_environment(this, RETRO_ENVIRONMENT_GET_AUDIO_VIDEO_ENABLE);
    register_environment(this, RETRO_ENVIRONMENT_GET_MIDI_INTERFACE);
    register_environment(this, RETRO_ENVIRONMENT_GET_FASTFORWARDING);
    register_environment(this, RETRO_ENVIRONMENT_GET_TARGET_REFRESH_RATE);
    register_environment(this, RETRO_ENVIRONMENT_GET_INPUT_BITMASKS);
    register_environment(this, RETRO_ENVIRONMENT_GET_CORE_OPTIONS_VERSION);
    register_environment(this, RETRO_ENVIRONMENT_SET_CORE_OPTIONS);
    register_environment(this, RETRO_ENVIRONMENT_SET_CORE_OPTIONS_INTL);
    register_environment(this, RETRO_ENVIRONMENT_SET_CORE_OPTIONS_DISPLAY);
    register_environment(this, RETRO_ENVIRONMENT_GET_PREFERRED_HW_RENDER);
    register_environment(this, RETRO_ENVIRONMENT_GET_DISK_CONTROL_INTERFACE_VERSION);
    register_environment(this, RETRO_ENVIRONMENT_SET_DISK_CONTROL_EXT_INTERFACE);
    register_environment(this, RETRO_ENVIRONMENT_GET_MESSAGE_INTERFACE_VERSION);
    register_environment(this, RETRO_ENVIRONMENT_SET_MESSAGE_EXT);
    register_environment(this, RETRO_ENVIRONMENT_GET_INPUT_MAX_USERS);
    register_environment(this, RETRO_ENVIRONMENT_SET_AUDIO_BUFFER_STATUS_CALLBACK);
    register_environment(this, RETRO_ENVIRONMENT_SET_MINIMUM_AUDIO_LATENCY);
    register_environment(this, RETRO_ENVIRONMENT_SET_FASTFORWARDING_OVERRIDE);
    register_environment(this, RETRO_ENVIRONMENT_SET_CONTENT_INFO_OVERRIDE);
    register_environment(this, RETRO_ENVIRONMENT_GET_GAME_INFO_EXT);
    register_environment(this, RETRO_ENVIRONMENT_SET_CORE_OPTIONS_V2);
    register_environment(this, RETRO_ENVIRONMENT_SET_CORE_OPTIONS_V2_INTL);
    register_environment(this, RETRO_ENVIRONMENT_SET_CORE_OPTIONS_UPDATE_DISPLAY_CALLBACK);
}

static void register_languages()
{
    this->languages = MTY_HashCreate(0);
    register_language(this, RETRO_LANGUAGE_ENGLISH);            
    register_language(this, RETRO_LANGUAGE_JAPANESE);           
    register_language(this, RETRO_LANGUAGE_FRENCH);             
    register_language(this, RETRO_LANGUAGE_SPANISH);            
    register_language(this, RETRO_LANGUAGE_GERMAN);             
    register_language(this, RETRO_LANGUAGE_ITALIAN);            
    register_language(this, RETRO_LANGUAGE_DUTCH);              
    register_language(this, RETRO_LANGUAGE_PORTUGUESE_BRAZIL);  
    register_language(this, RETRO_LANGUAGE_PORTUGUESE_PORTUGAL);
    register_language(this, RETRO_LANGUAGE_RUSSIAN);            
    register_language(this, RETRO_LANGUAGE_KOREAN);             
    register_language(this, RETRO_LANGUAGE_CHINESE_TRADITIONAL);
    register_language(this, RETRO_LANGUAGE_CHINESE_SIMPLIFIED); 
    register_language(this, RETRO_LANGUAGE_ESPERANTO);          
    register_language(this, RETRO_LANGUAGE_POLISH);             
    register_language(this, RETRO_LANGUAGE_VIETNAMESE);         
    register_language(this, RETRO_LANGUAGE_ARABIC);             
    register_language(this, RETRO_LANGUAGE_GREEK);              
    register_language(this, RETRO_LANGUAGE_TURKISH);            
    register_language(this, RETRO_LANGUAGE_SLOVAK);             
    register_language(this, RETRO_LANGUAGE_PERSIAN);            
    register_language(this, RETRO_LANGUAGE_HEBREW);             
    register_language(this, RETRO_LANGUAGE_ASTURIAN);           
    register_language(this, RETRO_LANGUAGE_FINNISH);            
}

static void register_joypad()
{
    this->joypad = MTY_HashCreate(0);
    register_joypad_key(this, RETRO_DEVICE_ID_JOYPAD_B);
    register_joypad_key(this, RETRO_DEVICE_ID_JOYPAD_Y);
    register_joypad_key(this, RETRO_DEVICE_ID_JOYPAD_SELECT);
    register_joypad_key(this, RETRO_DEVICE_ID_JOYPAD_START);
    register_joypad_key(this, RETRO_DEVICE_ID_JOYPAD_UP);
    register_joypad_key(this, RETRO_DEVICE_ID_JOYPAD_DOWN);
    register_joypad_key(this, RETRO_DEVICE_ID_JOYPAD_LEFT);
    register_joypad_key(this, RETRO_DEVICE_ID_JOYPAD_RIGHT);
    register_joypad_key(this, RETRO_DEVICE_ID_JOYPAD_A);
    register_joypad_key(this, RETRO_DEVICE_ID_JOYPAD_X);
    register_joypad_key(this, RETRO_DEVICE_ID_JOYPAD_L);
    register_joypad_key(this, RETRO_DEVICE_ID_JOYPAD_R);
    register_joypad_key(this, RETRO_DEVICE_ID_JOYPAD_L2);
    register_joypad_key(this, RETRO_DEVICE_ID_JOYPAD_R2);
    register_joypad_key(this, RETRO_DEVICE_ID_JOYPAD_L3);
    register_joypad_key(this, RETRO_DEVICE_ID_JOYPAD_R3);
}

static void register_keyboard()
{
    this->keyboard = MTY_HashCreate(0);
    register_keyboard_key(this, MTY_KEY_NONE);
    register_keyboard_key(this, MTY_KEY_ESCAPE);
    register_keyboard_key(this, MTY_KEY_1);
    register_keyboard_key(this, MTY_KEY_2);
    register_keyboard_key(this, MTY_KEY_3);
    register_keyboard_key(this, MTY_KEY_4);
    register_keyboard_key(this, MTY_KEY_5);
    register_keyboard_key(this, MTY_KEY_6);
    register_keyboard_key(this, MTY_KEY_7);
    register_keyboard_key(this, MTY_KEY_8);
    register_keyboard_key(this, MTY_KEY_9);
    register_keyboard_key(this, MTY_KEY_0);
    register_keyboard_key(this, MTY_KEY_MINUS);
    register_keyboard_key(this, MTY_KEY_EQUALS);
    register_keyboard_key(this, MTY_KEY_BACKSPACE);
    register_keyboard_key(this, MTY_KEY_TAB);
    register_keyboard_key(this, MTY_KEY_Q);
    register_keyboard_key(this, MTY_KEY_AUDIO_PREV);
    register_keyboard_key(this, MTY_KEY_W);
    register_keyboard_key(this, MTY_KEY_E);
    register_keyboard_key(this, MTY_KEY_R);
    register_keyboard_key(this, MTY_KEY_T);
    register_keyboard_key(this, MTY_KEY_Y);
    register_keyboard_key(this, MTY_KEY_U);
    register_keyboard_key(this, MTY_KEY_I);
    register_keyboard_key(this, MTY_KEY_O);
    register_keyboard_key(this, MTY_KEY_P);
    register_keyboard_key(this, MTY_KEY_AUDIO_NEXT);
    register_keyboard_key(this, MTY_KEY_LBRACKET);
    register_keyboard_key(this, MTY_KEY_RBRACKET);
    register_keyboard_key(this, MTY_KEY_ENTER);
    register_keyboard_key(this, MTY_KEY_NP_ENTER);
    register_keyboard_key(this, MTY_KEY_LCTRL);
    register_keyboard_key(this, MTY_KEY_RCTRL);
    register_keyboard_key(this, MTY_KEY_A);
    register_keyboard_key(this, MTY_KEY_S);
    register_keyboard_key(this, MTY_KEY_D);
    register_keyboard_key(this, MTY_KEY_MUTE);
    register_keyboard_key(this, MTY_KEY_F);
    register_keyboard_key(this, MTY_KEY_G);
    register_keyboard_key(this, MTY_KEY_AUDIO_PLAY);
    register_keyboard_key(this, MTY_KEY_H);
    register_keyboard_key(this, MTY_KEY_J);
    register_keyboard_key(this, MTY_KEY_AUDIO_STOP);
    register_keyboard_key(this, MTY_KEY_K);
    register_keyboard_key(this, MTY_KEY_L);
    register_keyboard_key(this, MTY_KEY_SEMICOLON);
    register_keyboard_key(this, MTY_KEY_QUOTE);
    register_keyboard_key(this, MTY_KEY_GRAVE);
    register_keyboard_key(this, MTY_KEY_LSHIFT);
    register_keyboard_key(this, MTY_KEY_BACKSLASH);
    register_keyboard_key(this, MTY_KEY_Z);
    register_keyboard_key(this, MTY_KEY_X);
    register_keyboard_key(this, MTY_KEY_C);
    register_keyboard_key(this, MTY_KEY_VOLUME_DOWN);
    register_keyboard_key(this, MTY_KEY_V);
    register_keyboard_key(this, MTY_KEY_B);
    register_keyboard_key(this, MTY_KEY_VOLUME_UP);
    register_keyboard_key(this, MTY_KEY_N);
    register_keyboard_key(this, MTY_KEY_M);
    register_keyboard_key(this, MTY_KEY_COMMA);
    register_keyboard_key(this, MTY_KEY_PERIOD);
    register_keyboard_key(this, MTY_KEY_SLASH);
    register_keyboard_key(this, MTY_KEY_NP_DIVIDE);
    register_keyboard_key(this, MTY_KEY_RSHIFT);
    register_keyboard_key(this, MTY_KEY_NP_MULTIPLY);
    register_keyboard_key(this, MTY_KEY_PRINT_SCREEN);
    register_keyboard_key(this, MTY_KEY_LALT);
    register_keyboard_key(this, MTY_KEY_RALT);
    register_keyboard_key(this, MTY_KEY_SPACE);
    register_keyboard_key(this, MTY_KEY_CAPS);
    register_keyboard_key(this, MTY_KEY_F1);
    register_keyboard_key(this, MTY_KEY_F2);
    register_keyboard_key(this, MTY_KEY_F3);
    register_keyboard_key(this, MTY_KEY_F4);
    register_keyboard_key(this, MTY_KEY_F5);
    register_keyboard_key(this, MTY_KEY_F6);
    register_keyboard_key(this, MTY_KEY_F7);
    register_keyboard_key(this, MTY_KEY_F8);
    register_keyboard_key(this, MTY_KEY_F9);
    register_keyboard_key(this, MTY_KEY_F10);
    register_keyboard_key(this, MTY_KEY_NUM_LOCK);
    register_keyboard_key(this, MTY_KEY_SCROLL_LOCK);
    register_keyboard_key(this, MTY_KEY_PAUSE);
    register_keyboard_key(this, MTY_KEY_NP_7);
    register_keyboard_key(this, MTY_KEY_HOME);
    register_keyboard_key(this, MTY_KEY_NP_8);
    register_keyboard_key(this, MTY_KEY_UP);
    register_keyboard_key(this, MTY_KEY_NP_9);
    register_keyboard_key(this, MTY_KEY_PAGE_UP);
    register_keyboard_key(this, MTY_KEY_NP_MINUS);
    register_keyboard_key(this, MTY_KEY_NP_4);
    register_keyboard_key(this, MTY_KEY_LEFT);
    register_keyboard_key(this, MTY_KEY_NP_5);
    register_keyboard_key(this, MTY_KEY_NP_6);
    register_keyboard_key(this, MTY_KEY_RIGHT);
    register_keyboard_key(this, MTY_KEY_NP_PLUS);
    register_keyboard_key(this, MTY_KEY_NP_1);
    register_keyboard_key(this, MTY_KEY_END);
    register_keyboard_key(this, MTY_KEY_NP_2);
    register_keyboard_key(this, MTY_KEY_DOWN);
    register_keyboard_key(this, MTY_KEY_NP_3);
    register_keyboard_key(this, MTY_KEY_PAGE_DOWN);
    register_keyboard_key(this, MTY_KEY_NP_0);
    register_keyboard_key(this, MTY_KEY_INSERT);
    register_keyboard_key(this, MTY_KEY_NP_PERIOD);
    register_keyboard_key(this, MTY_KEY_DELETE);
    register_keyboard_key(this, MTY_KEY_INTL_BACKSLASH);
    register_keyboard_key(this, MTY_KEY_F11);
    register_keyboard_key(this, MTY_KEY_F12);
    register_keyboard_key(this, MTY_KEY_LWIN);
    register_keyboard_key(this, MTY_KEY_RWIN);
    register_keyboard_key(this, MTY_KEY_APP);
    register_keyboard_key(this, MTY_KEY_F13);
    register_keyboard_key(this, MTY_KEY_F14);
    register_keyboard_key(this, MTY_KEY_F15);
    register_keyboard_key(this, MTY_KEY_F16);
    register_keyboard_key(this, MTY_KEY_F17);
    register_keyboard_key(this, MTY_KEY_F18);
    register_keyboard_key(this, MTY_KEY_F19);
    register_keyboard_key(this, MTY_KEY_MEDIA_SELECT);
    register_keyboard_key(this, MTY_KEY_JP);
    register_keyboard_key(this, MTY_KEY_RO);
    register_keyboard_key(this, MTY_KEY_HENKAN);
    register_keyboard_key(this, MTY_KEY_MUHENKAN);
    register_keyboard_key(this, MTY_KEY_INTL_COMMA);
    register_keyboard_key(this, MTY_KEY_YEN);
    register_keyboard_key(this, MTY_KEY_MAX);
}

void JUN_EnumsInitialize()
{
    this = MTY_Alloc(1, sizeof(JUN_Enums));

    register_environments();
    register_languages();
    register_joypad();
    register_keyboard();
}

static MTY_Hash *get_hash(JUN_EnumType type)
{
    switch (type)
    {
    case JUN_ENUM_ENVIRONMENT: return this->environments;
    case JUN_ENUM_LANGUAGE:    return this->languages;
    case JUN_ENUM_JOYPAD:      return this->joypad;
    case JUN_ENUM_KEYBOARD:    return this->keyboard;
    }
}

uint32_t JUN_EnumsGetInt(JUN_EnumType type, const char *key)
{
    MTY_Hash *hash = get_hash(type);

    return (uint32_t)MTY_HashGet(hash, key);
}

const char *JUN_EnumsGetString(JUN_EnumType type, uint32_t value)
{
    MTY_Hash *hash = get_hash(type);

    uint64_t iter   = 0;
    const char *key = NULL;
    uint32_t current  = 0;

    while (MTY_HashGetNextKey(hash, &iter, &key))
    {
        current = (uint32_t)MTY_HashGet(hash, key);

        if (current == value)
            break;

        key = NULL;
    }

    return key;
}

void JUN_EnumsDestroy()
{
    MTY_HashDestroy(&this->environments, NULL);
    MTY_HashDestroy(&this->languages,    NULL);
    MTY_HashDestroy(&this->joypad,       NULL);
    MTY_HashDestroy(&this->keyboard,     NULL);

    MTY_Free(this);
    this = NULL;
}
