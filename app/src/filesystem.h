#pragma once

#include "matoya.h"
#include "libretro.h"

#define MAX_FILES 32

typedef struct retro_vfs_interface JUN_Files;
typedef struct retro_vfs_file_handle JUN_File;
typedef struct retro_vfs_dir_handle JUN_Directory;

typedef void (*JUN_FilesystemCallback)(JUN_File *, void *opaque);

// TODO: this is ugly exposing all of this publicly
struct retro_vfs_file_handle
{
	bool exists;

	char *path;
	unsigned mode;
	unsigned hints;

	size_t size;
	unsigned offset;
	void *buffer;

	bool decompressed;
	uint32_t width;
	uint32_t height;
};

void JUN_FilesystemCreate();
JUN_Files *JUN_FilesystemGetInterface();
uint32_t JUN_FilesystemGetInterfaceVersion();
JUN_File *JUN_FilesystemGetFiles();
JUN_File *JUN_FilesystemGetNewFile(const char *path);
JUN_File *JUN_FilesystemGetExistingFile(const char *path);
void JUN_FilesystemSaveFile(const char *path, const void *buffer, size_t length);
void JUN_FilesystemClearFile(const char *path);
void JUN_FilesystemDestroy();
