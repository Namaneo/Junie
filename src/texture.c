#include "texture.h"

struct JUN_Texture
{
    uint8_t offset;
    uint32_t view_width;
    uint32_t view_height;

    uint8_t length;
    MTY_DrawData *draw_data;
    MTY_CmdList *commands;
};

JUN_Texture *JUN_TextureCreateContext(uint32_t view_width, uint32_t view_height, uint8_t offset)
{
    JUN_Texture *context = MTY_Alloc(1, sizeof(JUN_Texture));

    context->offset      = offset;
    context->view_width  = view_width;
    context->view_height = view_height;

    context->draw_data   = MTY_Alloc(1, sizeof(MTY_DrawData));
    context->commands    = MTY_Alloc(1, sizeof(MTY_CmdList));

    return context;
}

void JUN_TextureDraw(JUN_Texture *context, JUN_TextureData *texture)
{
    //Set texture dimensions
    uint8_t id          = texture->id + context->offset;
    float   x           = texture->x;
    float   y           = texture->y;
    float   width       = texture->width;
    float   height      = texture->height;
    float   view_width  = context->view_width;
    float   view_height = context->view_height;

    //Initialize indices
    uint16_t indices[6] =
    {
        0, 1, 2,   0, 2, 3,
    };

    //Initialize vertices
    MTY_Vtx vertices[4] =
    {
        { { x,         y          }, { 0, 0 }, 0xFFFFFFFF },
        { { x + width, y          }, { 1, 0 }, 0xFFFFFFFF },
        { { x + width, y + height }, { 1, 1 }, 0xFFFFFFFF },
        { { x,         y + height }, { 0, 1 }, 0xFFFFFFFF },
    };

    //Initialize texture commands
    MTY_Cmd commands[2] =
    {
        { 
            .texture = id,
            .elemCount = 3, 
            .idxOffset = 0,
            .clip = { 0, 0, view_width, view_height },
        },
        { 
            .texture = id, 
            .elemCount = 3, 
            .idxOffset = 3,
            .clip = { 0, 0, view_width, view_height },
        },
    };

    //Resize command lists
    context->length++;
    context->commands = MTY_Realloc(context->commands, context->length, sizeof(MTY_CmdList));

    //Initialize command list
    context->commands[context->length - 1] = (MTY_CmdList)
    {
        .cmd       = MTY_Dup(commands, sizeof commands),
        .cmdLength = 2,
        .cmdMax    = sizeof commands,

        .vtx       = MTY_Dup(vertices, sizeof vertices),
        .vtxLength = 4,
        .vtxMax    = sizeof vertices,

        .idx       = MTY_Dup(indices, sizeof indices),
        .idxLength = 6,
        .idxMax    = sizeof indices,
    };
}

MTY_DrawData *JUN_TextureProduce(JUN_Texture *context, size_t length)
{
    //Set number of commands to produce 
    if (length == 0)
        length = context->length;

    //Fill drawing data
    *context->draw_data = (MTY_DrawData)
    {
        .clear          = false,
        .displaySize    = { context->view_width, context->view_height },

        .cmdList        = context->commands,
        .cmdListLength  = length,
        .cmdListMax     = length * sizeof(MTY_CmdList),

        .vtxTotalLength = length * 4,
        .idxTotalLength = 6,
    };

    //Return produced drawing
    return context->draw_data;
}

void JUN_TextureDestroy(JUN_Texture **context)
{
    for (size_t i = 0; i < (*context)->length; ++i)
    {
        MTY_CmdList *command_list = &(*context)->commands[i];

        MTY_Free(command_list->cmd);
        MTY_Free(command_list->vtx);
        MTY_Free(command_list->idx);
    }

    MTY_Free((*context)->commands);
    MTY_Free((*context)->draw_data);

    MTY_Free(*context);
    *context = NULL;
}
