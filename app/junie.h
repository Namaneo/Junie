#pragma once

#include "libretro.h"

typedef enum retro_pixel_format JUN_CorePixelFormat;

typedef enum {
    JUN_DEVICE_JOYPAD  = RETRO_DEVICE_JOYPAD,
    JUN_DEVICE_POINTER = RETRO_DEVICE_POINTER,
} JUN_CoreInputDevice;

typedef enum {
    JUN_DEVICE_ID_JOYPAD_B      = RETRO_DEVICE_ID_JOYPAD_B,
    JUN_DEVICE_ID_JOYPAD_Y      = RETRO_DEVICE_ID_JOYPAD_Y,
    JUN_DEVICE_ID_JOYPAD_SELECT = RETRO_DEVICE_ID_JOYPAD_SELECT,
    JUN_DEVICE_ID_JOYPAD_START  = RETRO_DEVICE_ID_JOYPAD_START,
    JUN_DEVICE_ID_JOYPAD_UP     = RETRO_DEVICE_ID_JOYPAD_UP,
    JUN_DEVICE_ID_JOYPAD_DOWN   = RETRO_DEVICE_ID_JOYPAD_DOWN,
    JUN_DEVICE_ID_JOYPAD_LEFT   = RETRO_DEVICE_ID_JOYPAD_LEFT,
    JUN_DEVICE_ID_JOYPAD_RIGHT  = RETRO_DEVICE_ID_JOYPAD_RIGHT,
    JUN_DEVICE_ID_JOYPAD_A      = RETRO_DEVICE_ID_JOYPAD_A,
    JUN_DEVICE_ID_JOYPAD_X      = RETRO_DEVICE_ID_JOYPAD_X,
    JUN_DEVICE_ID_JOYPAD_L      = RETRO_DEVICE_ID_JOYPAD_L,
    JUN_DEVICE_ID_JOYPAD_R      = RETRO_DEVICE_ID_JOYPAD_R,
    JUN_DEVICE_ID_JOYPAD_L2     = RETRO_DEVICE_ID_JOYPAD_L2,
    JUN_DEVICE_ID_JOYPAD_R2     = RETRO_DEVICE_ID_JOYPAD_R2,
    JUN_DEVICE_ID_JOYPAD_L3     = RETRO_DEVICE_ID_JOYPAD_L3,
    JUN_DEVICE_ID_JOYPAD_R3     = RETRO_DEVICE_ID_JOYPAD_R3,

    JUN_DEVICE_ID_POINTER_X       = RETRO_DEVICE_ID_POINTER_X,      
    JUN_DEVICE_ID_POINTER_Y       = RETRO_DEVICE_ID_POINTER_Y,      
    JUN_DEVICE_ID_POINTER_PRESSED = RETRO_DEVICE_ID_POINTER_PRESSED,
    JUN_DEVICE_ID_POINTER_COUNT   = RETRO_DEVICE_ID_POINTER_COUNT,  
} JUN_CoreInputID;

typedef struct {
    void *data;
    JUN_CorePixelFormat format;
    uint32_t width;
    uint32_t height;
    uint32_t pitch;
    float ratio;
} JUN_CoreVideo;

typedef struct {
    void *data;
    float rate;
    size_t frames;
    size_t size;
} JUN_CoreAudio;

typedef struct {
    char *key;
    char *value;
    char *name;
    char *options;
} JUN_CoreVariable;

typedef struct {
    uint32_t index;
    bool enabled;
    char *code;
} JUN_CoreCheat;

void JUN_CoreCreate(const char *system, const char *rom);
bool JUN_CoreStartGame();
void JUN_CoreDestroy();

void JUN_CoreLock();
void JUN_CoreUnlock();

const JUN_CoreVideo *JUN_CoreGetVideo();
const JUN_CoreAudio *JUN_CoreGetAudio();
const JUN_CoreVariable *JUN_CoreGetVariables();

void JUN_CoreSetSpeed(uint8_t speed);
void JUN_CoreSetInput(JUN_CoreInputDevice device, JUN_CoreInputID id, int16_t value);
void JUN_CoreSetVariables(const JUN_CoreVariable *variables);
void JUN_CoreSetCheats(const JUN_CoreCheat *cheats);

void JUN_CoreSaveState();
void JUN_CoreRestoreState();
