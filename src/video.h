#pragma once

#include "input.h"

typedef struct JUN_Video JUN_Video;

JUN_Video *JUN_VideoInitialize(JUN_Input *input, MTY_AppFunc app_func, MTY_EventFunc event_func);
void JUN_VideoStart(JUN_Video *this);
void JUN_VideoSetAssets(JUN_Video *this, JUN_TextureType type, const char *base_path, const char *file_name);
bool JUN_VideoSetPixelFormat(JUN_Video *this, enum retro_pixel_format *format);
void JUN_VideoUpdateContext(JUN_Video *this, unsigned width, unsigned height, size_t pitch);
void JUN_VideoUpdateUI(JUN_Video *this);
void JUN_VideoDrawFrame(JUN_Video *this, const void *data);
void JUN_VideoDrawUI(JUN_Video *this, bool has_gamepad);
void JUN_VideoDrawLoadingScreen(JUN_Video *this);
void JUN_VideoPresent(JUN_Video *this);
void JUN_VideoDestroy(JUN_Video **video);
