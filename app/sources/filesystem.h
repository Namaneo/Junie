#pragma once

#include <stdint.h>
#include <stdbool.h>

#include "libretro.h"

#define MAX_FILES 32

typedef struct retro_vfs_interface JUN_Files;
typedef struct retro_vfs_file_handle JUN_File;
typedef struct retro_vfs_dir_handle JUN_Directory;

void JUN_FilesystemCreate();
JUN_Files *JUN_FilesystemGetInterface();
uint32_t JUN_FilesystemGetInterfaceVersion();
void *JUN_FilesystemGetFileBuffer(const char *path, uint32_t length);
int32_t JUN_FilesystemCountFiles();
int32_t JUN_FilesystemGetFileIndex(const char *path);
bool JUN_FilesystemIsFileUpdated(int32_t index);
const char *JUN_FilesystemGetFilePath(int32_t index);
uint32_t JUN_FilesystemGetFileLength(int32_t index);
const void *JUN_FilesystemReadFile(int32_t index);
void JUN_FilesystemSeenFile(int32_t index);
void JUN_FilesystemSaveFile(const char *path, const void *buffer, uint32_t length);
void JUN_FilesystemDestroy();
