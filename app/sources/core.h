#pragma once

#include "libretro.h"

typedef bool (*JUN_CoreEnvironmentFunc)(unsigned cmd, void *data, void *opaque);
typedef void (*JUN_CoreVideoRefreshFunc)(const void *data, unsigned width, unsigned height, size_t pitch, void *opaque);
typedef size_t (*JUN_CoreAudioSampleFunc)(const int16_t *data, size_t frames, void *opaque);
typedef void (*JUN_CoreInputPollFunc)(void *opaque);
typedef int16_t (*JUN_CoreInputStateFunc)(unsigned port, unsigned device, unsigned index, unsigned id, void *opaque);

typedef struct {
	void *opaque;

	JUN_CoreEnvironmentFunc environment;
	JUN_CoreVideoRefreshFunc video_refresh;
	JUN_CoreAudioSampleFunc audio_sample;
	JUN_CoreInputPollFunc input_poll;
	JUN_CoreInputStateFunc input_state;
} JUN_CoreCallbacks;

void JUN_CoreCreate(const char *system, const char *rom, const char *settings, const char *library);
char *JUN_CoreGetDefaultConfiguration(const char *library);
void JUN_CoreSetCallbacks(JUN_CoreCallbacks *callbacks);
bool JUN_CoreEnvironment(unsigned cmd, void *data);
double JUN_CoreGetSampleRate();
double JUN_CoreGetFramesPerSecond();
enum retro_pixel_format JUN_CoreGetFormat();
bool JUN_CoreStartGame();
void JUN_CoreRun(uint8_t fast_forward);
void JUN_CoreSaveState();
void JUN_CoreRestoreState();
void JUN_CoreDestroy();
