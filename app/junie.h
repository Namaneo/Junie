#pragma once

#include "libretro.h"

typedef enum {
	JUN_DEVICE_JOYPAD  = RETRO_DEVICE_JOYPAD,
	JUN_DEVICE_POINTER = RETRO_DEVICE_POINTER,
} JunieInputDevice;

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
} JunieInputID;

typedef struct {
	char *key;
	char *value;
	char *name;
	char *options;
} JunieVariable;

typedef struct {
	uint32_t index;
	bool enabled;
	char *code;
} JunieCheat;

void JunieCreate(const char *system, const char *rom);
bool JunieStartGame();
void JunieDestroy();

void JunieLock();
void JunieUnlock();

const JunieVariable *JunieGetVariables();

void JunieSetSpeed(uint8_t speed);
void JunieSetInput(JunieInputDevice device, JunieInputID id, int16_t value);
void JunieSetVariables(const JunieVariable *variables);
void JunieSetCheats(const JunieCheat *cheats);

void JunieSaveState();
void JunieRestoreState();
