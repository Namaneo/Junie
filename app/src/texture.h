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

JUN_Texture *JUN_TextureCreate(uint32_t view_width, uint32_t view_height);
void JUN_TextureDraw(JUN_Texture *this, JUN_TextureData *texture);
MTY_DrawData *JUN_TextureProduce(JUN_Texture *this, size_t length);
void JUN_TextureDestroy(JUN_Texture **texture);
