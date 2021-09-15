#include <stdlib.h>

#include "matoya.h"

#include "menu.h"

struct JUN_Menu
{
    bool has_gamepad;
    bool has_audio;
    bool should_save_state;
    bool should_restore_state;
};

JUN_Menu *JUN_MenuInitialize()
{
    JUN_Menu *this = MTY_Alloc(1, sizeof(JUN_Menu));

    this->has_gamepad = true;

    return this;
}

bool JUN_MenuHasAudio(JUN_Menu *this)
{
    return this->has_audio;
}

void JUN_MenuToggleAudio(JUN_Menu *this)
{
    this->has_audio = !this->has_audio;
}

bool JUN_MenuHasGamepad(JUN_Menu *this)
{
    return this->has_gamepad;
}

void JUN_MenuToggleGamepad(JUN_Menu *this)
{
    this->has_gamepad = !this->has_gamepad;
}

void JUN_MenuShouldSaveState(JUN_Menu *this)
{
    this->should_save_state = true;
}

bool JUN_MenuHasPendingStateSave(JUN_Menu *this)
{
    return this->should_save_state;
}

void JUN_MenuSetStateSaved(JUN_Menu *this)
{
    this->should_save_state = false;
}

void JUN_MenuShouldRestoreState(JUN_Menu *this)
{
    this->should_restore_state = true;
}

bool JUN_MenuHasPendingStateRestore(JUN_Menu *this)
{
    return this->should_restore_state;
}

void JUN_MenuSetStateRestored(JUN_Menu *this)
{
    this->should_restore_state = false;
}

void JUN_MenuDestroy(JUN_Menu **this)
{
    MTY_Free(*this);
    *this = NULL;
}
