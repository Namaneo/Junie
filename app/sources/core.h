#pragma once

#include <stdint.h>
#include <stdbool.h>

void JUN_CoreCreate(const char *system, const char *rom);
bool JUN_CoreStartGame();
void JUN_CoreRun(uint8_t fast_forward);
void JUN_CoreDestroy();

uint32_t JUN_CoreGetPixelFormat();
uint32_t JUN_CoreGetSampleRate();
void JUN_CoreSetInput(uint8_t device, uint8_t id, int16_t value);

void JUN_CoreSaveState();
void JUN_CoreRestoreState();

void JUN_CoreResetCheats();
void JUN_CoreSetCheat(uint32_t index, bool enabled, const char *code);

uint32_t JUN_CoreGetVariableCount();
const char *JUN_CoreGetVariableKey(uint32_t index);
const char *JUN_CoreGetVariableName(uint32_t index);
const char *JUN_CoreGetVariableOptions(uint32_t index);
void JUN_CoreSetVariable(const char *key, const char *value);

const void *JUN_CoreGetFrameData();
uint32_t JUN_CoreGetFrameWidth();
uint32_t JUN_CoreGetFrameHeight();
uint32_t JUN_CoreGetFramePitch();
const int16_t *JUN_CoreGetAudioData();
uint32_t JUN_CoreGetAudioFrames();
