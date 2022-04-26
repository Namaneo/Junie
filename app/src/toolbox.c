#include <string.h>

#include "matoya.h"

#include "toolbox.h"

char *JUN_ToolboxReplaceExtension(const char *str, const char *ext)
{
	if (!str || !ext)
		return NULL;

	char *name = MTY_Strdup(str);
	*strrchr(name, '.') = '\0';

	char *result = strlen(ext) 
		? MTY_SprintfD("%s.%s", name, ext)
		: MTY_SprintfD("%s", name);

	MTY_Free(name);

	return result;
}
