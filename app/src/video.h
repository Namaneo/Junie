#pragma once

#include "input.h"

typedef struct JUN_Video JUN_Video;

typedef void (*JUN_VideoCallback)(MTY_Webview *webview, void *opaque);

JUN_Video *JUN_VideoCreate(JUN_State *state, JUN_Input *input, MTY_AppFunc app_func, MTY_EventFunc event_func);
void JUN_VideoCreateUI(JUN_Video *this, JUN_VideoCallback callback, void *opaque);
void JUN_VideoStart(JUN_Video *this);
bool JUN_VideoSetPixelFormat(JUN_Video *this, enum retro_pixel_format *format);
void JUN_VideoUpdateContext(JUN_Video *this, unsigned width, unsigned height, size_t pitch);
void JUN_VideoDrawFrame(JUN_Video *this, const void *data);
void JUN_VideoDrawUI(JUN_Video *this, bool has_gamepad);
void JUN_VideoPresent(JUN_Video *this);
void JUN_VideoDestroy(JUN_Video **video);
