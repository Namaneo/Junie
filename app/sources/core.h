#pragma once

#include <stdint.h>
#include <stdbool.h>

void JUN_CoreCreate(const char *system, const char *rom);
bool JUN_CoreStartGame();
void JUN_CoreRun(uint8_t fast_forward);
void JUN_CoreSetInput(uint8_t device, uint8_t id, int16_t value);
void JUN_CoreDestroy();

uint32_t JUN_CoreGetPixelFormat();
uint32_t JUN_CoreGetSampleRate();
const void *JUN_CoreGetVideo();
const void *JUN_CoreGetAudio();

const void *JUN_CoreGetVariables();
void JUN_CoreSetVariable(const char *key, const char *value);

void JUN_CoreSaveState();
void JUN_CoreRestoreState();

void JUN_CoreResetCheats();
void JUN_CoreSetCheat(uint32_t index, bool enabled, const char *code);
