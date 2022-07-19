#include "matoya.h"

#include "interop.h"

void JUN_InteropTrace()
{
	
}

double JUN_InteropGetPixelRatio()
{
	return 1;
}

void JUN_InteropRefreshFiles()
{

}

bool JUN_InteropReadDir(const char *path, size_t index, char **file)
{
	return false;
}

void *JUN_InteropReadFile(const char *path, size_t *length)
{
	return MTY_ReadFile(path, length);
}

void JUN_InteropWriteFile(const char *path, const void *data, size_t length)
{
	MTY_WriteFile(path, data, length);
}
