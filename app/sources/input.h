#pragma once

#include <stdint.h>

#include "state.h"

#define JUN_MENU_MASK 0x10

typedef enum {
	JUN_MENU_TOGGLE_GAMEPAD = 0 | JUN_MENU_MASK,
	JUN_MENU_TOGGLE_AUDIO   = 1 | JUN_MENU_MASK,
	JUN_MENU_SAVE_STATE     = 2 | JUN_MENU_MASK,
	JUN_MENU_RESTORE_STATE  = 3 | JUN_MENU_MASK,
	JUN_MENU_FAST_FORWARD   = 4 | JUN_MENU_MASK,
	JUN_MENU_EXIT           = 5 | JUN_MENU_MASK,
	JUN_MENU_MAX            = 6 | JUN_MENU_MASK,
} JUN_MenuType;

typedef struct JUN_Input JUN_Input;

JUN_Input *JUN_InputCreate(JUN_State *state);
void JUN_InputDestroy(JUN_Input **input);
void JUN_InputMapTouch(JUN_Input *ctx, uint8_t id, double x, double y, double radius);
void JUN_InputSetCallback(JUN_Input *ctx, uint8_t id, JUN_StateCallback callback);
void JUN_InputPollEvents(JUN_Input *ctx);
int16_t JUN_InputGetStatus(JUN_Input *ctx, uint8_t id, uint8_t device);
void JUN_InputReset(JUN_Input *ctx);
