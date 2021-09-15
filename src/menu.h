#pragma once

#include <stdbool.h>

typedef struct JUN_Menu JUN_Menu;

typedef void (*JUN_MenuCallback)(JUN_Menu *this);

typedef enum JUN_MenuType JUN_MenuType;

enum JUN_MenuType
{
    MENU_TOGGLE_GAMEPAD = 0,
    MENU_TOGGLE_AUDIO   = 1,
    MENU_SAVE_STATE     = 2,
    MENU_RESTORE_STATE  = 3,
    MENU_MAX            = 4,
};

JUN_Menu *JUN_MenuInitialize();
bool JUN_MenuHasAudio(JUN_Menu *this);
void JUN_MenuToggleAudio(JUN_Menu *this);
bool JUN_MenuHasGamepad(JUN_Menu *this);
void JUN_MenuToggleGamepad(JUN_Menu *this);
void JUN_MenuShouldSaveState(JUN_Menu *this);
bool JUN_MenuHasPendingStateSave(JUN_Menu *this);
void JUN_MenuSetStateSaved(JUN_Menu *this);
void JUN_MenuShouldRestoreState(JUN_Menu *this);
bool JUN_MenuHasPendingStateRestore(JUN_Menu *this);
void JUN_MenuSetStateRestored(JUN_Menu *this);
void JUN_MenuDestroy(JUN_Menu **this);
