#include "filesystem.h"

#include <stdlib.h>
#include <stdbool.h>
#include <string.h>

#include "tools.h"

#define VFS_INTERFACE_VERSION 2

static struct CTX {
	JUN_Files *interface;
	JUN_File *files;
} CTX;

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
	CTX.files = calloc(MAX_FILES, sizeof(JUN_File));
	CTX.interface = calloc(1, sizeof(JUN_Files));

	/* V1 */
	CTX.interface->get_path = fs_get_path;
	CTX.interface->open = fs_open;
	CTX.interface->close = fs_close;
	CTX.interface->size = fs_size;
	CTX.interface->tell = fs_tell;
	CTX.interface->seek = fs_seek;
	CTX.interface->read = fs_read;
	CTX.interface->write = fs_write;
	CTX.interface->flush = fs_flush;
	CTX.interface->remove = fs_remove;
	CTX.interface->rename = fs_rename;

	/* V2 */
	CTX.interface->truncate = fs_truncate;

	/* V3 */
	CTX.interface->stat = fs_stat;
	CTX.interface->mkdir = fs_mkdir;
	CTX.interface->opendir = fs_opendir;
	CTX.interface->readdir = fs_readdir;
	CTX.interface->dirent_get_name = fs_dirent_get_name;
	CTX.interface->dirent_is_dir = fs_dirent_is_dir;
	CTX.interface->closedir = fs_closedir;
}

JUN_Files *JUN_FilesystemGetInterface()
{
	return CTX.interface;
}

uint32_t JUN_FilesystemGetInterfaceVersion()
{
	return VFS_INTERFACE_VERSION;
}

JUN_File *JUN_FilesystemGetNewFile(const char *path, uint32_t length)
{
	for (int i = 0; i < MAX_FILES; ++i) {
		if (!CTX.files[i].exists) {
			CTX.files[i].exists = true;
			CTX.files[i].path = strdup(path);

			if (length > 0) {
				CTX.files[i].size = length;
				CTX.files[i].buffer = calloc(length, 1);
			}

			return &CTX.files[i];
		}
	}

	return NULL;
}

uint32_t JUN_FilesystemCountFiles()
{
	for (int i = 0; i < MAX_FILES; ++i)
		if (!CTX.files[i].exists)
			return i;

	return 0;
}

JUN_File *JUN_FilesystemGetFile(uint32_t index)
{
	return &CTX.files[index];
}

JUN_File *JUN_FilesystemReadFile(const char *path)
{
	for (int i = 0; i < MAX_FILES; ++i)
		if (CTX.files[i].exists && !strcmp(CTX.files[i].path, path))
			return &CTX.files[i];

	return NULL;
}

void JUN_FilesystemSaveFile(const char *path, const void *buffer, uint32_t length)
{
	JUN_File *file = JUN_FilesystemReadFile(path);

	if (!file) {
		file = JUN_FilesystemGetNewFile(path, length);

	} else {
		file->size = length;
		file->buffer = realloc(file->buffer, file->size);
	}

	memcpy(file->buffer, buffer, file->size);
}

void JUN_FilesystemDestroy()
{
	for (int i = 0; CTX.files && i < MAX_FILES; ++i) {
		if (CTX.files[i].path)
			free(CTX.files[i].path);

		if (CTX.files[i].buffer)
			free(CTX.files[i].buffer);
	}

	free(CTX.files);
	CTX.files = NULL;

	free(CTX.interface);
	CTX.interface = NULL;
}

/* V1 */

static const char *fs_get_path(JUN_File *stream)
{
	return stream->path;
}

static JUN_File *fs_open(const char *path, unsigned mode, unsigned hints)
{
	JUN_Log("%s (mode: %d)", path, mode);

	// XXX Skip melonDS firmware file to avoid conflicts between runs
	if (strstr(path, "firmware.bin"))
		return NULL;

	JUN_File *file = JUN_FilesystemReadFile(path);
	if (file)
		return file;

	if (!(mode & RETRO_VFS_FILE_ACCESS_WRITE))
		return NULL;

	file = JUN_FilesystemGetNewFile(path, 0);

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
	JUN_Log("%s", path);

	JUN_File *file = JUN_FilesystemReadFile(path);
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
	JUN_Log("%s -> %s", old_path, new_path);

	JUN_File *file = JUN_FilesystemReadFile(old_path);
	if (!file)
		return -1;

	free(file->path);
	file->path = strdup(new_path);

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
