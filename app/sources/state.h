#pragma once

#include <stdint.h>
#include <stdbool.h>

typedef struct JUN_State JUN_State;

typedef void (*JUN_StateCallback)(JUN_State *this);

JUN_State *JUN_StateCreate();
bool JUN_StateHasGamepad(JUN_State *this);
void JUN_StateToggleGamepad(JUN_State *this);
bool JUN_StateHasAudio(JUN_State *this);
void JUN_StateToggleAudio(JUN_State *this);
bool JUN_StateShouldSaveState(JUN_State *this);
void JUN_StateToggleSaveState(JUN_State *this);
bool JUN_StateShouldRestoreState(JUN_State *this);
void JUN_StateToggleRestoreState(JUN_State *this);
uint8_t JUN_StateGetFastForward(JUN_State *this);
void JUN_StateToggleFastForward(JUN_State *this);
void JUN_StateGetFrameMetrics(JUN_State *this, float *width, float *height);
void JUN_StateSetFrameMetrics(JUN_State *this, float width, float height);
void JUN_StateGetWindowMetrics(JUN_State *this, float *width, float *height);
void JUN_StateSetWindowMetrics(JUN_State *this, float width, float height);
void JUN_StateToggleExit(JUN_State *this);
bool JUN_StateShouldExit(JUN_State *this);
void JUN_StateDestroy(JUN_State **this);
