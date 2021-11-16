#pragma once

#include "matoya.h"
#include "libretro.h"

#define MAX_FILES 32

typedef struct retro_vfs_interface   JUN_Files;
typedef struct retro_vfs_file_handle JUN_File;
typedef struct retro_vfs_dir_handle  JUN_Directory;

typedef void (*JUN_VfsCallback)(JUN_File *, void *opaque);

//TODO: this is ugly exposing all of this publicly
struct retro_vfs_file_handle
{
    bool exists;

    char *path;
    unsigned mode;
    unsigned hints;

    size_t size;
    unsigned offset;
    void *buffer;

    bool remote;
    MTY_Async state;
    uint32_t index;
    uint16_t code;
    JUN_VfsCallback callback;
    void *opaque;

    bool decompressed;
    uint32_t width;
    uint32_t height;
};

void JUN_VfsInitialize();
JUN_Files *JUN_VfsGetInterface();
uint32_t JUN_VfsGetInterfaceVersion();
JUN_File *JUN_VfsGetFiles();
JUN_File *JUN_VfsGetNewFile(const char *path);
JUN_File *JUN_VfsGetExistingFile(const char *path);
void JUN_VfsSaveFile(const char *path, void *buffer, size_t length);
void JUN_VfsDestroy();