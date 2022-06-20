#include "texture.h"

struct JUN_Texture {
	uint32_t view_width;
	uint32_t view_height;

	uint8_t length;
	MTY_DrawData *draw_data;
	MTY_CmdList *commands;
};

JUN_Texture *JUN_TextureCreate(uint32_t view_width, uint32_t view_height)
{
	JUN_Texture *this = MTY_Alloc(1, sizeof(JUN_Texture));

	this->view_width = view_width;
	this->view_height = view_height;

	this->draw_data = MTY_Alloc(1, sizeof(MTY_DrawData));
	this->commands = MTY_Alloc(1, sizeof(MTY_CmdList));

	return this;
}

void JUN_TextureDraw(JUN_Texture *this, JUN_TextureData *texture)
{
	// Set texture dimensions
	uint8_t id = texture->id + 1;
	float x = texture->x;
	float y = texture->y;
	float width = texture->width;
	float height = texture->height;
	float view_width = this->view_width;
	float view_height = this->view_height;

	// Initialize indices
	uint16_t indices[6] = { 0, 1, 2, 0, 2, 3 };

	// Initialize vertices
	MTY_Vtx vertices[4] =
	{
		{ {x, y},                  {0, 0}, 0xFFFFFFFF },
		{ {x + width, y},          {1, 0}, 0xFFFFFFFF },
		{ {x + width, y + height}, {1, 1}, 0xFFFFFFFF },
		{ {x, y + height},         {0, 1}, 0xFFFFFFFF },
	};

	// Initialize texture commands
	MTY_Cmd commands[2] =
	{
		{
			.texture = id,
			.elemCount = 3,
			.idxOffset = 0,
			.clip = {0, 0, view_width, view_height},
		},
		{
			.texture = id,
			.elemCount = 3,
			.idxOffset = 3,
			.clip = {0, 0, view_width, view_height},
		},
	};

	// Resize command lists
	this->length++;
	this->commands = MTY_Realloc(this->commands, this->length, sizeof(MTY_CmdList));

	// Initialize command list
	this->commands[this->length - 1] = (MTY_CmdList) {
		.cmd = MTY_Dup(commands, sizeof commands),
		.cmdLength = 2,
		.cmdMax = sizeof commands,

		.vtx = MTY_Dup(vertices, sizeof vertices),
		.vtxLength = 4,
		.vtxMax = sizeof vertices,

		.idx = MTY_Dup(indices, sizeof indices),
		.idxLength = 6,
		.idxMax = sizeof indices,
	};
}

MTY_DrawData *JUN_TextureProduce(JUN_Texture *this, size_t length)
{
	// Set number of commands to produce
	if (length == 0)
		length = this->length;

	// Fill drawing data
	*this->draw_data = (MTY_DrawData) {
		.clear = false,
		.displaySize = {this->view_width, this->view_height},

		.cmdList = this->commands,
		.cmdListLength = length,
		.cmdListMax = length * sizeof(MTY_CmdList),

		.vtxTotalLength = length * 4,
		.idxTotalLength = 6,
	};

	// Return produced drawing
	return this->draw_data;
}

void JUN_TextureDestroy(JUN_Texture **texture)
{
	if (!texture || !*texture)
		return;

	JUN_Texture *this = *texture;

	for (size_t i = 0; i < this->length; ++i) {
		MTY_CmdList *command_list = &this->commands[i];

		MTY_Free(command_list->cmd);
		MTY_Free(command_list->vtx);
		MTY_Free(command_list->idx);
	}

	MTY_Free(this->commands);
	MTY_Free(this->draw_data);

	MTY_Free(this);
	*texture = NULL;
}
