#include <stdio.h>
#include <string.h>

#include "matoya.h"
#include "debug.h"

static void log_func(const char *message, void *opaque)
{
	if (message[strlen(message) - 1] != '\n')
		printf("%s\n", message);
	else
		printf("%s", message);
}

void JUN_SetLogFunc()
{
	MTY_SetLogFunc(log_func, NULL);
}
