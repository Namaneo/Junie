#pragma once

#include "matoya.h"

typedef struct JUN_Texture JUN_Texture;

typedef struct JUN_TextureData JUN_TextureData;

struct JUN_TextureData
{
    uint8_t id;
    float x;
    float y;
    float width;
    float height;
    float image_width;
    float image_height;
};

JUN_Texture *JUN_TextureCreateContext(uint32_t view_width, uint32_t view_height, uint8_t offset);
void JUN_TextureDraw(JUN_Texture *context, JUN_TextureData *texture);
MTY_DrawData *JUN_TextureProduce(JUN_Texture *context, size_t length);
void JUN_TextureDestroy(JUN_Texture **context);