#pragma once

#include "libretro.h"

typedef struct {
    void *data;
    enum retro_pixel_format format;
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
    char *name;
    char *options;
    char *value;
} JUN_CoreVariable;

void JUN_CoreCreate(const char *system, const char *rom);
bool JUN_CoreStartGame();
void JUN_CoreDestroy();

void JUN_CoreLock();
void JUN_CoreUnlock();

const JUN_CoreVideo *JUN_CoreGetVideo();
const JUN_CoreAudio *JUN_CoreGetAudio();

void JUN_CoreSetSpeed(uint8_t speed);
void JUN_CoreSetInput(uint8_t device, uint8_t id, int16_t value);

const JUN_CoreVariable *JUN_CoreGetVariables();
void JUN_CoreSetVariable(const char *key, const char *value);

void JUN_CoreSaveState();
void JUN_CoreRestoreState();

void JUN_CoreResetCheats();
void JUN_CoreSetCheat(uint32_t index, bool enabled, const char *code);
