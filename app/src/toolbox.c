#include <string.h>

#include "matoya.h"

#include "toolbox.h"

char *JUN_ToolboxReplaceExtension(const char *str, const char *ext)
{
    char *name = MTY_Strdup(str);
    *strrchr(name, '.') = '\0';

    char *result = MTY_SprintfD("%s.%s", name, ext);

    MTY_Free(name);

    return result;
}
