#include <cstring>

#include "rml/file.h"

void JUN_FrontFileInterface::Add(const char *name, const void *data, size_t size)
{
    this->files[name].data = data;
    this->files[name].size = size;
}

FileHandle JUN_FrontFileInterface::Open(const String& path)
{
    if (!this->files[path].data)
        return 0;

    FileHandle handle = this->current;
    this->handles[handle] = path;
    this->current++;
    
    return handle;
}

void JUN_FrontFileInterface::Close(FileHandle handle)
{
    struct file *file = &this->files[this->handles[handle]];

    file->data = NULL;
    file->size = 0;
}

size_t JUN_FrontFileInterface::Read(void* buffer, size_t size, FileHandle handle)
{
    struct file *file = &this->files[this->handles[handle]];

    size_t end = file->offset + size;
    size = end > size ? size - (end - size) : size;

    memcpy(buffer, (char *)file->data + file->offset, size);

    file->offset += size;

    return size;
}

bool JUN_FrontFileInterface::Seek(FileHandle handle, long offset, int origin)
{
    struct file *file = &this->files[this->handles[handle]];

    switch (origin) {
        case SEEK_SET:
            file->offset = offset;
            break;
        case SEEK_CUR:
            file->offset += offset;
            break;
        case SEEK_END:
            file->offset = file->size + offset;
            break;
    }

    return true;
}

size_t JUN_FrontFileInterface::Tell(FileHandle handle)
{
    struct file *file = &this->files[this->handles[handle]];

    return file->offset;
}
