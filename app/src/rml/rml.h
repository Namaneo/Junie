#pragma once

#include <stdint.h>
#include <stdbool.h>

#include "matoya.h"

#ifdef __cplusplus
	#define EXPORT_C extern "C"
#else
    #define EXPORT_C
#endif

EXPORT_C void JUN_FrontInitialize(MTY_App *app);
EXPORT_C bool JUN_FrontCreateContext(int32_t window_w, int32_t window_h);
EXPORT_C bool JUN_FrontLoadStyle(const void *data, size_t size);
EXPORT_C bool JUN_FrontLoadFont(const void *data, size_t size);
EXPORT_C bool JUN_FrontLoadDocument(const void *data, size_t size);
EXPORT_C void JUN_FrontProcessEvent(const MTY_Event *event);
EXPORT_C MTY_DrawData *JUN_FrontRender(MTY_App *app);
EXPORT_C void JUN_FrontShutdown();
