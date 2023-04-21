#pragma once

#include <stdint.h>

#include "libretro.h"

#define MAX_FILES 32

typedef struct retro_vfs_interface JUN_Files;
typedef struct retro_vfs_file_handle JUN_File;
typedef struct retro_vfs_dir_handle JUN_Directory;

typedef void (*JUN_FilesystemCallback)(JUN_File *file, void *opaque);

// TODO Ugly to expose all of this publicly
struct retro_vfs_file_handle {
	bool exists;
	bool updated;

	char *path;
	unsigned mode;
	unsigned hints;

	uint32_t size;
	unsigned offset;
	void *buffer;
};

void JUN_FilesystemCreate();
JUN_Files *JUN_FilesystemGetInterface();
uint32_t JUN_FilesystemGetInterfaceVersion();
uint32_t JUN_FilesystemCountFiles();
JUN_File *JUN_FilesystemGetNewFile(const char *path, uint32_t length);
JUN_File *JUN_FilesystemGetFile(uint32_t index);
JUN_File *JUN_FilesystemReadFile(const char *path);
void JUN_FilesystemSaveFile(const char *path, const void *buffer, uint32_t length);
void JUN_FilesystemDestroy();
