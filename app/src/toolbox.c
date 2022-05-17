#include <string.h>

#include "matoya.h"

#include "toolbox.h"

char *JUN_ToolboxRemoveExtension(const char *str)
{
	if (!str)
		return NULL;

	size_t length = (uint64_t) strrchr(str, '.') - (uint64_t) str;
	char *result = MTY_Alloc(length + 1, 1);
	memcpy(result, str, length);

	return result;
}
