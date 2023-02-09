#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <SDL2/SDL.h>

#include "filesystem.h"

#define VFS_INTERFACE_VERSION 2

static JUN_Files *interface;
static JUN_File *files;

/* V1 */

static const char *fs_get_path(JUN_File *stream);
static JUN_File *fs_open(const char *path, unsigned mode, unsigned hints);
static int fs_close(JUN_File *stream);
static int64_t fs_size(JUN_File *stream);
static int64_t fs_tell(JUN_File *stream);
static int64_t fs_seek(JUN_File *stream, int64_t offset, int seek_position);
static int64_t fs_read(JUN_File *stream, void *s, uint64_t len);
static int64_t fs_write(JUN_File *stream, const void *s, uint64_t len);
static int fs_flush(JUN_File *stream);
static int fs_remove(const char *path);
static int fs_rename(const char *old_path, const char *new_path);

/* V2 */

static int64_t fs_truncate(JUN_File *stream, int64_t length);

/* V3 */

static int fs_stat(const char *path, int32_t *size);
static int fs_mkdir(const char *dir);
static JUN_Directory *fs_opendir(const char *dir, bool include_hidden);
static bool fs_readdir(JUN_Directory *dirstream);
static const char *fs_dirent_get_name(JUN_Directory *dirstream);
static bool fs_dirent_is_dir(JUN_Directory *dirstream);
static int fs_closedir(JUN_Directory *dirstream);

/* Public */

void JUN_FilesystemCreate()
{
	files = calloc(MAX_FILES, sizeof(JUN_File));

	interface = calloc(1, sizeof(JUN_Files));

	/* V1 */
	interface->get_path = fs_get_path;
	interface->open = fs_open;
	interface->close = fs_close;
	interface->size = fs_size;
	interface->tell = fs_tell;
	interface->seek = fs_seek;
	interface->read = fs_read;
	interface->write = fs_write;
	interface->flush = fs_flush;
	interface->remove = fs_remove;
	interface->rename = fs_rename;

	/* V2 */
	interface->truncate = fs_truncate;

	/* V3 */
	interface->stat = fs_stat;
	interface->mkdir = fs_mkdir;
	interface->opendir = fs_opendir;
	interface->readdir = fs_readdir;
	interface->dirent_get_name = fs_dirent_get_name;
	interface->dirent_is_dir = fs_dirent_is_dir;
	interface->closedir = fs_closedir;
}

JUN_Files *JUN_FilesystemGetInterface()
{
	return interface;
}

uint32_t JUN_FilesystemGetInterfaceVersion()
{
	return VFS_INTERFACE_VERSION;
}

JUN_File *JUN_FilesystemGetFiles()
{
	return files;
}

JUN_File *JUN_FilesystemGetNewFile(const char *path)
{
	for (int i = 0; i < MAX_FILES; ++i) {
		if (!files[i].exists) {
			files[i].exists = true;
			files[i].path = SDL_strdup(path);

			return &files[i];
		}
	}
	return NULL;
}

static void *read_file(const char *path, int32_t *length)
{
	FILE *file = fopen(path, "r");
	if (!file)
		return NULL;

	fseek(file, 0, SEEK_END);
	int32_t size = ftell(file);
	fseek(file, 0, SEEK_SET);

	void *data = calloc(size, 1);
	fread(data, 1, size, file);

	if (length)
		*length = size;

	return data;
}

static void write_file(const char *path, const void *data, int32_t length)
{
	FILE *file = fopen(path, "w+");
	if (!file)
		return;

	fwrite(data, 1, length, file);
}

JUN_File *JUN_FilesystemGetExistingFile(const char *path)
{
	for (int i = 0; i < MAX_FILES; ++i)
		if (files[i].exists && strcmp(files[i].path, path) == 0)
			return &files[i];

	int32_t size = 0;
	void *buffer = read_file(path, &size);

	if (buffer) {
		JUN_File *file = JUN_FilesystemGetNewFile(path);

		file->buffer = buffer;
		file->size = size;

		return file;
	}

	return NULL;
}

void JUN_FilesystemSaveFile(const char *path, const void *buffer, size_t length)
{
	JUN_File *file = JUN_FilesystemGetExistingFile(path);

	if (!file)
		file = JUN_FilesystemGetNewFile(path);

	file->size = length;
	file->buffer = file->buffer
		? realloc(file->buffer, file->size)
		: calloc(file->size, 1);

	memcpy(file->buffer, buffer, file->size);

	write_file(file->path, file->buffer, file->size);
}

void JUN_FilesystemDestroy()
{
	for (int i = 0; files && i < MAX_FILES; ++i) {
		if (files[i].path)
			free(files[i].path);

		if (files[i].buffer)
			free(files[i].buffer);
	}

	free(files);
	files = NULL;

	free(interface);
	interface = NULL;
}

/* V1 */

static const char *fs_get_path(JUN_File *stream)
{
	return stream->path;
}

static JUN_File *fs_open(const char *path, unsigned mode, unsigned hints)
{
	SDL_LogInfo(0, "%s (mode: %d)", path, mode);

	// XXX Skip melonDS firmware file to avoid conflicts between runs
	if (strstr(path, "firmware.bin"))
		return NULL;

	JUN_File *file = JUN_FilesystemGetExistingFile(path);
	if (file)
		return file;

	if (!(mode & RETRO_VFS_FILE_ACCESS_WRITE))
		return NULL;

	file = JUN_FilesystemGetNewFile(path);

	file->mode = mode;
	file->hints = hints;

	return file;
}

static int fs_close(JUN_File *stream)
{
	stream->offset = 0;

	return 0;
}

static int64_t fs_size(JUN_File *stream)
{
	return stream->size;
}

static int64_t fs_tell(JUN_File *stream)
{
	return stream->offset;
}

static int64_t fs_seek(JUN_File *stream, int64_t offset, int seek_position)
{
	switch (seek_position)
	{
	case RETRO_VFS_SEEK_POSITION_START:
		stream->offset = offset;
		break;
	case RETRO_VFS_SEEK_POSITION_CURRENT:
		stream->offset += offset;
		break;
	case RETRO_VFS_SEEK_POSITION_END:
		stream->offset = stream->size + offset;
		break;
	}

	return stream->offset;
}

static int64_t fs_read(JUN_File *stream, void *s, uint64_t len)
{
	uint64_t length = len > stream->size - stream->offset
		? stream->size - stream->offset
		: len;

	memcpy(s, stream->buffer + stream->offset, length);

	stream->offset += length;

	return length;
}

static int64_t fs_write(JUN_File *stream, const void *s, uint64_t len)
{
	uint64_t total_size = stream->offset + len;
	if (total_size > stream->size) {
		stream->size = total_size;
		stream->buffer = realloc(stream->buffer, total_size);
	}

	memcpy(stream->buffer + stream->offset, s, len);

	stream->offset += len;

	JUN_FilesystemSaveFile(stream->path, stream->buffer, stream->size);

	return 0;
}

static int fs_flush(JUN_File *stream)
{
	return 0;
}

static int fs_remove(const char *path)
{
	SDL_LogInfo(0, "%s", path);

	JUN_File *file = JUN_FilesystemGetExistingFile(path);
	if (!file)
		return -1;

	file->exists = false;
	file->path = NULL;
	file->mode = 0;
	file->hints = 0;
	file->size = 0;
	file->offset = 0;

	if (file->buffer)
		free(file->buffer);
	file->buffer = NULL;

	return 0;
}

static int fs_rename(const char *old_path, const char *new_path)
{
	SDL_LogInfo(0, "%s -> %s", old_path, new_path);

	JUN_File *file = JUN_FilesystemGetExistingFile(old_path);
	if (!file)
		return -1;

	free(file->path);
	file->path = SDL_strdup(new_path);

	return 0;
}

/* V2 */

static int64_t fs_truncate(JUN_File *stream, int64_t length)
{
	if (!stream->buffer)
		return -1;

	stream->size = length;
	stream->buffer = realloc(stream->buffer, length);

	return 0;
}

/* V3 */

static int fs_stat(const char *path, int32_t *size)
{
	return -1;
}

static int fs_mkdir(const char *dir)
{
	return -1;
}

static JUN_Directory *fs_opendir(const char *dir, bool include_hidden)
{
	return NULL;
}

static bool fs_readdir(JUN_Directory *dirstream)
{
	return false;
}

static const char *fs_dirent_get_name(JUN_Directory *dirstream)
{
	return NULL;
}

static bool fs_dirent_is_dir(JUN_Directory *dirstream)
{
	return false;
}

static int fs_closedir(JUN_Directory *dirstream)
{
	return -1;
}
