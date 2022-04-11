#pragma once

#include <stdint.h>
#include <stdbool.h>

#include "matoya.h"

#ifdef __cplusplus
	#define EXPORT_C extern "C"
#else
    #define EXPORT_C
#endif

typedef struct MTY_Front MTY_Front;

EXPORT_C void JUN_FrontInitialize(MTY_App *app);
EXPORT_C void JUN_FrontAddResource(const char *name, const void *data, size_t size);
EXPORT_C MTY_Front *JUN_FrontCreate(const char *name, const char *document, const char *font);
EXPORT_C void JUN_FrontProcessEvent(MTY_Front *ctx, const MTY_Event *event);
EXPORT_C MTY_DrawData *JUN_FrontRender(MTY_Front *ctx);
EXPORT_C void JUN_FrontDestroy(MTY_Front **front);
EXPORT_C void JUN_FrontShutdown();
