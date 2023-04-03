#pragma once

#include <stdint.h>

void JUN_CoreCreate(const char *system, const char *rom);
void *JUN_CoreGetFileBuffer(const char *path, uint32_t length);
uint32_t JUN_CoreCountFiles();
const char *JUN_CoreGetFilePath(uint32_t index);
uint32_t JUN_CoreGetFileLength(uint32_t index);
const void *JUN_CoreReadFile(uint32_t index);
void JUN_CoreResetCheats();
void JUN_CoreSetCheat(uint32_t index, uint8_t enabled, const char *code);
uint8_t JUN_CoreStartGame();
double JUN_CoreGetSampleRate();
uint32_t JUN_CoreGetVariableCount();
const char *JUN_CoreGetVariableKey(uint32_t index);
const char *JUN_CoreGetVariableName(uint32_t index);
const char *JUN_CoreGetVariableOptions(uint32_t index);
void JUN_CoreSetVariable(const char *key, const char *value);
void JUN_CoreSetInput(uint8_t device, uint8_t id, int16_t value);
void JUN_CoreRun(uint8_t fast_forward);
const void *JUN_CoreGetFrameData();
uint32_t JUN_CoreGetFrameWidth();
uint32_t JUN_CoreGetFrameHeight();
const int16_t *JUN_CoreGetAudioData();
uint32_t JUN_CoreGetAudioFrames();
void JUN_CoreSaveState();
void JUN_CoreRestoreState();
void JUN_CoreDestroy();
