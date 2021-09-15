#include <string.h>

#include "filesystem.h"

#include "core.h"

struct JUN_Core
{
    void *handle;
    bool initialized;

    char *game_path;
    char *state_path;
    char *sram_path;
    char *rtc_path;

    MTY_Time last_save;

    JUN_Configuration *configuration;

    struct retro_game_info game;
    struct retro_system_info system;
    struct retro_system_av_info av;

    void (*retro_init)(void);
    bool (*retro_load_game)(const struct retro_game_info *game);
    void (*retro_get_system_info)(struct retro_system_info *info);
    void (*retro_get_system_av_info)(struct retro_system_av_info *info);

    void (*retro_set_environment)(retro_environment_t);
    void (*retro_set_video_refresh)(retro_video_refresh_t);
    void (*retro_set_input_poll)(retro_input_poll_t);
    void (*retro_set_input_state)(retro_input_state_t);
    void (*retro_set_audio_sample)(retro_audio_sample_t);
    void (*retro_set_audio_sample_batch)(retro_audio_sample_batch_t);

    size_t (*retro_get_memory_size)(unsigned type);
    void *(*retro_get_memory_data)(unsigned type);

    size_t (*retro_serialize_size)(void);
    bool (*retro_serialize)(void *data, size_t size);
    bool (*retro_unserialize)(const void *data, size_t size);

    void (*retro_run)(void);
    void (*retro_reset)(void);
    void (*retro_unload_game)(void);
    void (*retro_deinit)(void);
};

#define map_symbol(function) this->function = function

//TODO: ugly parameters here, must be improved
JUN_Core *JUN_CoreInitialize(const char *game_path, const char *state_path, const char *sram_path, const char *rtc_path)
{
    JUN_Core *this = MTY_Alloc(1, sizeof(JUN_Core));

    this->configuration = JUN_ConfigurationInitialize();

    this->game_path  = MTY_Strdup(game_path);
    this->state_path = MTY_Strdup(state_path);
    this->sram_path  = MTY_Strdup(sram_path);
    this->rtc_path   = MTY_Strdup(rtc_path);

    map_symbol(retro_init);
    map_symbol(retro_load_game);
    map_symbol(retro_get_system_info);
    map_symbol(retro_get_system_av_info);

    map_symbol(retro_set_environment);
    map_symbol(retro_set_video_refresh);
    map_symbol(retro_set_input_poll);
    map_symbol(retro_set_input_state);
    map_symbol(retro_set_audio_sample);
    map_symbol(retro_set_audio_sample_batch);

    map_symbol(retro_get_memory_size);
    map_symbol(retro_get_memory_data);

    map_symbol(retro_serialize_size);
    map_symbol(retro_serialize);
    map_symbol(retro_unserialize);

    map_symbol(retro_run);
    map_symbol(retro_reset);
    map_symbol(retro_unload_game);
    map_symbol(retro_deinit);

    return this;
}

JUN_Configuration *JUN_CoreGetConfiguration(JUN_Core *this)
{
    return this->configuration;
}

void JUN_CoreSetCallbacks(JUN_Core *this, JUN_CoreCallbacks *callbacks)
{
    this->retro_set_environment(        callbacks->environment        );
    this->retro_set_video_refresh(      callbacks->video_refresh      );
    this->retro_set_input_poll(         callbacks->input_poll         );
    this->retro_set_input_state(        callbacks->input_state        );
    this->retro_set_audio_sample(       callbacks->audio_sample       );
    this->retro_set_audio_sample_batch( callbacks->audio_sample_batch );
}

bool JUN_CoreHasStarted(JUN_Core *this)
{
    return this->initialized;
}

double JUN_CoreGetSampleRate(JUN_Core *this)
{
    return this->av.timing.sample_rate;
}

double JUN_CoreGetFramesPerSecond(JUN_Core *this)
{
    return this->av.timing.fps;
}

bool JUN_CoreStartGame(JUN_Core *this)
{
    this->retro_init();

    this->retro_get_system_info(&this->system);

    JUN_File *game = JUN_FilesystemGet(this->game_path, false);

    this->game.path = game->path;
    this->game.size = game->size;
    if (!this->system.need_fullpath)
    {
        this->game.data = MTY_Alloc(this->game.size, 1);
        memcpy((void *)this->game.data, game->buffer, this->game.size);
    }

    this->initialized = this->retro_load_game(&this->game);

    this->retro_get_system_av_info(&this->av);

    return this->initialized;
}

void JUN_CoreRun(JUN_Core *this)
{
    this->retro_run();
}

void save_memory(JUN_Core *this, uint32_t type, const char *path)
{
    void *buffer = this->retro_get_memory_data(type);
    if (!buffer)
        return;

    size_t size = this->retro_get_memory_size(type);
    if (!size)
        return;

    JUN_FilesystemSave(path, buffer, size);
}

void JUN_CoreSaveMemories(JUN_Core *this)
{
    if (MTY_TimeDiff(this->last_save, MTY_GetTime()) < 1000)
        return;

    this->last_save = MTY_GetTime();

    save_memory(this, RETRO_MEMORY_SAVE_RAM, this->sram_path);
    save_memory(this, RETRO_MEMORY_RTC,      this->rtc_path);
}

static void restore_memory(JUN_Core *this, uint32_t type, const char *path)
{
    void *buffer = this->retro_get_memory_data(type);
    if (!buffer)
        return;

    size_t size = this->retro_get_memory_size(type);
    if (!size)
        return;

    JUN_File *file = JUN_FilesystemGet(path, false);
    if (!file) 
        return;

    memcpy(buffer, file->buffer, size);
}

void JUN_CoreRestoreMemories(JUN_Core *this)
{
    restore_memory(this, RETRO_MEMORY_SAVE_RAM, this->sram_path);
    restore_memory(this, RETRO_MEMORY_RTC,      this->rtc_path);
}

void JUN_CoreSaveState(JUN_Core *this)
{
    size_t size = this->retro_serialize_size();

    void *data = MTY_Alloc(size, 1);

    this->retro_serialize(data, size);

    JUN_VfsSaveFile(this->state_path, data, size);

    MTY_Free(data);
}

void JUN_CoreRestoreState(JUN_Core *this)
{
    size_t size = this->retro_serialize_size();

    JUN_File *file = JUN_VfsGetExistingFile(this->state_path);
    if (!file)
        return;

    this->retro_unserialize(file->buffer, size);
}

void JUN_CoreDestroy(JUN_Core **this)
{
    JUN_ConfigurationDestroy(&(*this)->configuration);

    MTY_Free((*this)->game_path);
    MTY_Free((*this)->sram_path);
    MTY_Free((*this)->rtc_path);

    if ((*this)->initialized)
        (*this)->retro_deinit();

    if ((*this)->game.data)
        MTY_Free((void *)(*this)->game.data);

    MTY_Free(*this);
    *this = NULL;
}