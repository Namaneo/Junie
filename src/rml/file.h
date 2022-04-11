#pragma once

#include <map>

#define RMLUI_STATIC_LIB
#define RMLUI_NO_THIRDPARTY_CONTAINERS
#define RMLUI_USE_CUSTOM_RTTI
#include "RmlUi/Core.h"

using namespace Rml;

class JUN_FrontFileInterface : public FileInterface
{
private:
    struct file {
        const void *data;
        size_t size;
        size_t offset;
    };

    FileHandle current = 1;
    std::map<FileHandle, std::string> handles;
    std::map<std::string, struct file> files;

public:
    void Add(const char *name, const void *data, size_t size);

	FileHandle Open(const String& path) override;
	void Close(FileHandle handle) override;
	size_t Read(void* buffer, size_t size, FileHandle handle) override;
	bool Seek(FileHandle handle, long offset, int origin) override;
	size_t Tell(FileHandle handle) override;
};
