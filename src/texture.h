#pragma once

#include "matoya.h"

typedef struct JUN_Texture JUN_Texture;

typedef struct JUN_TextureData JUN_TextureData;

struct JUN_TextureData
{
    uint8_t id;
    uint32_t x;
    uint32_t y;
    uint32_t width;
    uint32_t height;
};

JUN_Texture *JUN_TextureCreateContext(uint32_t view_width, uint32_t view_height, uint8_t offset);
void JUN_TextureDraw(JUN_Texture *context, JUN_TextureData *texture);
MTY_DrawData *JUN_TextureProduce(JUN_Texture *context);
void JUN_TextureDestroy(JUN_Texture **context);