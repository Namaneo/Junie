#include <stdlib.h>
#include <stdio.h>
#include <string.h>

#include "core.h"

// clang -o junie -Isrc -Iinclude -DDYNAMIC src/core.c src/filesystem.c src/configuration.c interop.c main.c -L. -lmatoya -lm
// ./junie "Game Boy Advance" "Mario Kart - Super Circuit (Europe).gba" "{}" "./mgba_libretro.so"

static bool environment(unsigned cmd, void *data, void *opaque)
{
	return JUN_CoreEnvironment(cmd, data);
}

static void video_refresh(const void *data, unsigned width, unsigned height, size_t pitch, void *opaque)
{

}

static void audio_sample(int16_t left, int16_t right, void *opaque)
{

}

static size_t audio_sample_batch(const int16_t *data, size_t frames, void *opaque)
{
	return frames;
}

static void input_poll(void *opaque)
{

}

static int16_t input_state(unsigned port, unsigned device, unsigned index, unsigned id, void *opaque)
{
	return 0;
}

void main_loop(void *opaque)
{
	JUN_CoreRun(1);
	JUN_CoreSaveMemories();
}

void start_game(const char *system, const char *rom, const char *settings, const char *library)
{
	JUN_CoreCreate(system, rom, settings, library);

	JUN_CoreSetCallbacks(& (JUN_CoreCallbacks) {
		.opaque             = NULL,
		.environment        = environment,
		.video_refresh      = video_refresh,
		.audio_sample       = audio_sample,
		.audio_sample_batch = audio_sample_batch,
		.input_poll         = input_poll,
		.input_state        = input_state,
	});

	if (!JUN_CoreStartGame()) {
		MTY_Log("Core for system '%s' failed to start rom '%s'", system, rom);
		return;
	}

	JUN_CoreRestoreMemories();
	JUN_CoreSetCheats();

	while (true) {
		main_loop(NULL);
		MTY_Sleep(1);
	}
}

static void log_func(const char *message, void *opaque)
{
	if (message[strlen(message) - 1] != '\n')
		printf("%s\n", message);
	else
		printf("%s", message);
}

int main(int argc, char *argv[])
{
	MTY_SetLogFunc(log_func, NULL);

	const char *system   = argv[1];
	const char *rom      = argv[2];
	const char *settings = argv[3];
	const char *library  = argv[4];

	MTY_Log("system:   %s",   system);
	MTY_Log("rom:      %s",      rom);
	MTY_Log("settings: %s", settings);
	MTY_Log("library:  %s",  library);

	start_game(system, rom, settings, library);
}
