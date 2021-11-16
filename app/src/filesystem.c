#include <string.h>
#include <time.h>

#include "interop.h"
#include "enums.h"

#include "filesystem.h"

struct JUN_Filesystem
{
    char *host;
    uint16_t port;
    bool secure;
};

static JUN_Filesystem *this;

void JUN_FilesystemInitialize()
{
    this = MTY_Alloc(1, sizeof(JUN_Filesystem));

    JUN_VfsInitialize();

    MTY_HttpAsyncCreate(4);

    this->host = JUN_InteropGetHost();
    this->port = JUN_InteropGetPort();
    this->secure = JUN_InteropIsSecure();
}

void JUN_FilesystemDownload(const char *path, JUN_VfsCallback callback, void *opaque)
{
    JUN_File *file = JUN_VfsGetNewFile(path);

    file->remote = true;
    file->state = MTY_ASYNC_CONTINUE;
    file->callback = callback;
    file->opaque = opaque;

    MTY_HttpAsyncRequest(&file->index,
        this->host, this->port, this->secure, 
        "GET", file->path, NULL, NULL, 0, 60000, NULL
    );
}

bool JUN_FilesystemReady()
{
    JUN_File *files = JUN_VfsGetFiles();

    for (int i = 0; i < MAX_FILES; ++i)
    {
        if (!files[i].remote || files[i].buffer)
            continue;

        if (files[i].code)
            return false;

        files[i].state = MTY_HttpAsyncPoll(files[i].index, 
            &files[i].buffer, &files[i].size, &files[i].code
        );

        if (files[i].state != MTY_ASYNC_OK)
            return false;

        if (files[i].callback)
            files[i].callback(&files[i], files[i].opaque);
    }

    return true;
}

JUN_File *JUN_FilesystemGet(const char *path, bool image)
{
    JUN_File *file = JUN_VfsGetExistingFile(path);

    if (!file)
        return NULL;

    if (file->remote && file->state != MTY_ASYNC_OK)
        return NULL;

    if (image && !file->decompressed)
    {
        file->buffer = MTY_DecompressImage(file->buffer, file->size, &file->width, &file->height);
        file->decompressed = true;
    }

    return file;
}

void JUN_FilesystemSave(const char *path, void *buffer, size_t size)
{
    JUN_VfsSaveFile(path, buffer, size);
}

void JUN_FilesystemDestroy()
{
    MTY_HttpAsyncDestroy();

    JUN_VfsDestroy();

    MTY_Free(this->host);

    MTY_Free(this);
    this = NULL;
}
