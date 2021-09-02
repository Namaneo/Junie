#pragma once

#include "vfs.h"
#include "core.h"

typedef struct JUN_Filesystem JUN_Filesystem;

void JUN_FilesystemInitialize();
void JUN_FilesystemDownload(const char *path, JUN_VfsCallback callback, void *opaque);
bool JUN_FilesystemReady();
JUN_File *JUN_FilesystemGet(const char *path, bool image);
void JUN_FilesystemSave(const char *path, void *buffer, size_t size);
void JUN_FilesystemDestroy();
