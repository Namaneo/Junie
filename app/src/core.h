#pragma once

#include "configuration.h"

#include "libretro.h"

typedef struct {
	retro_environment_t environment;
	retro_video_refresh_t video_refresh;
	retro_audio_sample_t audio_sample;
	retro_audio_sample_batch_t audio_sample_batch;
	retro_input_poll_t input_poll;
	retro_input_state_t input_state;
} JUN_CoreCallbacks;

void JUN_CoreCreate(const char *system, const char *rom, const char *settings);
const MTY_JSON *JUN_CoreGetDefaultConfiguration();
void JUN_CoreSetCallbacks(JUN_CoreCallbacks *callbacks);
bool JUN_CoreEnvironment(unsigned cmd, void *data);
double JUN_CoreGetSampleRate();
double JUN_CoreGetFramesPerSecond();
enum retro_pixel_format JUN_CoreGetFormat();
bool JUN_CoreStartGame();
bool JUN_CoreHasStarted();
void JUN_CoreRun(size_t count);
void JUN_CoreSaveMemories();
void JUN_CoreRestoreMemories();
void JUN_CoreSetCheats();
void JUN_CoreResetCheats();
void JUN_CoreSaveState();
void JUN_CoreRestoreState();
void JUN_CoreDestroy();
