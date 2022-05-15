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

JUN_File *JUN_FilesystemGet(const char *path)
{
	JUN_File *file = JUN_VfsGetExistingFile(path);

	if (!file)
		return NULL;

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
