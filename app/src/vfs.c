#include <string.h>

#include "matoya.h"

#include "interop.h"

#include "vfs.h"

#define VFS_INTERFACE_VERSION 2

static JUN_Files *interface;
static JUN_File  *files;

/* V1 */

static const char *get_path(JUN_File *stream);
static JUN_File   *open(const char *path, unsigned mode, unsigned hints);
static int        close(JUN_File *stream);
static int64_t    size(JUN_File *stream);
static int64_t    tell(JUN_File *stream);
static int64_t    seek(JUN_File *stream, int64_t offset, int seek_position);
static int64_t    read(JUN_File *stream, void *s, uint64_t len);
static int64_t    write(JUN_File *stream, const void *s, uint64_t len);
static int        flush(JUN_File *stream);
static int        remove(const char *path);
static int        rename(const char *old_path, const char *new_path);

/* V2 */

static int64_t                      truncate(JUN_File *stream, int64_t length);

/* V3 */

static int           stat(const char *path, int32_t *size);
static int           mkdir(const char *dir);
static JUN_Directory *opendir(const char *dir, bool include_hidden);
static bool          readdir(JUN_Directory *dirstream);
static const char    *dirent_get_name(JUN_Directory *dirstream);
static bool          dirent_is_dir(JUN_Directory *dirstream);
static int           closedir(JUN_Directory *dirstream);

/* Public */

void JUN_VfsInitialize()
{
    files = MTY_Alloc(MAX_FILES, sizeof(JUN_File));

    interface = MTY_Alloc(1, sizeof(JUN_Files));

    /* V1 */
    interface->get_path = get_path;
    interface->open     = open;
    interface->close    = close;
    interface->size     = size;
    interface->tell     = tell;
    interface->seek     = seek;
    interface->read     = read;
    interface->write    = write;
    interface->flush    = flush;
    interface->remove   = remove;
    interface->rename   = rename;

    /* V2 */
    interface->truncate = truncate;

    /* V3 */
    interface->stat            = stat;
    interface->mkdir           = mkdir;
    interface->opendir         = opendir;
    interface->readdir         = readdir;
    interface->dirent_get_name = dirent_get_name;
    interface->dirent_is_dir   = dirent_is_dir;
    interface->closedir        = closedir;
}

JUN_Files *JUN_VfsGetInterface()
{
    return interface;
}

uint32_t JUN_VfsGetInterfaceVersion()
{
    return VFS_INTERFACE_VERSION;
}

JUN_File *JUN_VfsGetFiles()
{
    return files;
}

JUN_File *JUN_VfsGetNewFile(const char *path)
{
    for (int i = 0; i < MAX_FILES; ++i)
    {
        if (!files[i].exists)
        {
            files[i].exists = true;
            files[i].path = MTY_Strdup(path);

            return &files[i];
        }
    }
    return NULL;
}

JUN_File *JUN_VfsGetExistingFile(const char *path)
{
    for (int i = 0; i < MAX_FILES; ++i)
    {
        if (files[i].exists && strcmp(files[i].path, path) == 0)
            return &files[i];
    }

    size_t size;
    void *buffer = JUN_InteropReadFile(path, &size);

    if (buffer)
    {
        JUN_File *file = JUN_VfsGetNewFile(path);

        file->buffer = buffer;
        file->size = size;

        return file;
    }

    return NULL;
}

void JUN_VfsSaveFile(const char *path, void *buffer, size_t length)
{
    JUN_File *file = JUN_VfsGetExistingFile(path);

    if (!file)
        file = JUN_VfsGetNewFile(path);

    file->size = length;
    file->buffer = file->buffer 
        ? MTY_Realloc(file->buffer, file->size, 1)
        : MTY_Alloc(file->size, 1);

    memcpy(file->buffer, buffer, file->size);

    JUN_InteropWriteFile(file->path, file->buffer, file->size);
}

void JUN_VfsDestroy()
{
    for (int i = 0; i < MAX_FILES; ++i)
    {
        if (files[i].path)
            MTY_Free(files[i].path);

        if (files[i].buffer)
            MTY_Free(files[i].buffer);
    }

    MTY_Free(files);
    files = NULL;

    MTY_Free(interface);
    interface = NULL;
}

/* V1 */

static const char *get_path(JUN_File *stream)
{
    return stream->path;
}

static JUN_File *open(const char *path, unsigned mode, unsigned hints)
{
    MTY_Log("%s (mode: %d)", path, mode);

    JUN_File *file = JUN_VfsGetExistingFile(path);
    if (file)
        return file;

    if (!(mode & RETRO_VFS_FILE_ACCESS_WRITE))
        return NULL;

    file = JUN_VfsGetNewFile(path);

    file->mode = mode;
    file->hints = hints;

    return file;
}

static int close(JUN_File *stream)
{
    stream->offset = 0;

    return 0;
}

static int64_t size(JUN_File *stream)
{
    return stream->size;
}

static int64_t tell(JUN_File *stream)
{
    return stream->offset;
}

static int64_t seek(JUN_File *stream, int64_t offset, int seek_position)
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

static int64_t read(JUN_File *stream, void *s, uint64_t len)
{
    uint64_t length = len > stream->size - stream->offset 
        ? stream->size - stream->offset 
        : len;

    memcpy(s, stream->buffer + stream->offset, length);

    stream->offset += length;

    return length;
}

static int64_t write(JUN_File *stream, const void *s, uint64_t len)
{
    uint64_t total_size = stream->offset + len;
    if (total_size > stream->size)
    {
        stream->size = total_size;
        stream->buffer = MTY_Realloc(stream->buffer, total_size, 1);
    }

    memcpy(stream->buffer + stream->offset, s, len);

    stream->offset += len;

    JUN_VfsSaveFile(stream->path, stream->buffer, stream->size);

    return 0;
}

static int flush(JUN_File *stream)
{
    return 0;
}

static int remove(const char *path)
{
    MTY_Log("%s", path);

    JUN_File *file = JUN_VfsGetExistingFile(path);
    if (!file)
        return -1;

    file->exists = false;
    file->path = NULL;
    file->mode = 0;
    file->hints = 0;
    file->size = 0;
    file->offset = 0;

    if (file->buffer)
        MTY_Free(file->buffer);
    file->buffer = NULL;

    return 0;
}

static int rename(const char *old_path, const char *new_path)
{
    MTY_Log("%s -> %s", old_path, new_path);

    JUN_File *file = JUN_VfsGetExistingFile(old_path);
    if (!file)
        return -1;

    MTY_Free(file->path);
    file->path = MTY_Strdup(new_path);

    return 0;
}

/* V2 */

static int64_t truncate(JUN_File *stream, int64_t length)
{
    if (!stream->buffer)
        return -1;
    
    stream->size = length;
    stream->buffer = MTY_Realloc(stream->buffer, length, 1);

    return 0;
}

/* V3 */

static int stat(const char *path, int32_t *size)
{
    return -1;
}

static int mkdir(const char *dir)
{
    return -1;
}

static JUN_Directory *opendir(const char *dir, bool include_hidden)
{
    return NULL;
}

static bool readdir(JUN_Directory *dirstream)
{
    return false;
}

static const char *dirent_get_name(JUN_Directory *dirstream)
{
    return NULL;
}

static bool dirent_is_dir(JUN_Directory *dirstream)
{
    return false;
}

static int closedir(JUN_Directory *dirstream)
{
    return -1;
}
