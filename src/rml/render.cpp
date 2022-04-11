#include "rml/render.h"

JUN_FrontRenderInterface::JUN_FrontRenderInterface(MTY_App *app)
{
    this->app = app;

    this->GenerateTexture(this->empty_texture, new byte[4] { 0xFF, 0xFF, 0xFF, 0xFF }, Vector2i(1, 1));
}

MTY_DrawData *JUN_FrontRenderInterface::GetData()
{
    return &this->data;
}

void JUN_FrontRenderInterface::ClearData()
{
    for (void *ref : this->refs)
        MTY_Free(ref);
    this->refs.clear();

    if (this->data.cmdList)
        MTY_Free(this->data.cmdList);

    this->data = {0};
    this->data.clear = true;
}

void JUN_FrontRenderInterface::RenderGeometry(Vertex* vertices, int num_vertices, int* indices, int num_indices, TextureHandle texture, const Vector2f& translation)
{
    int num_commands = 1;

    Rml::Vector2i dimensions = this->GetContext()->GetDimensions();

    this->data.displaySize.x = dimensions.x;
    this->data.displaySize.y = dimensions.y;
    this->data.vtxTotalLength += num_vertices;
    this->data.idxTotalLength += num_indices;

    MTY_CmdList *cmd_list = (MTY_CmdList *) MTY_Realloc(
        this->data.cmdList, this->data.cmdListLength + 1, sizeof(MTY_CmdList));

    this->data.cmdList       = (MTY_CmdList *) cmd_list;
    this->data.cmdListLength = this->data.cmdListLength + 1;
    this->data.cmdListMax    = this->data.cmdListLength * sizeof(MTY_CmdList);

    cmd_list = &this->data.cmdList[this->data.cmdListLength - 1];

    cmd_list->cmd = (MTY_Cmd *)  MTY_Alloc(num_commands, sizeof(MTY_Cmd));
    cmd_list->vtx = (MTY_Vtx *)  MTY_Alloc(num_vertices, sizeof(MTY_Vtx));
    cmd_list->idx = (uint16_t *) MTY_Alloc(num_indices, sizeof(uint16_t));

    cmd_list->cmdLength = num_commands;
    cmd_list->cmdMax    = sizeof(MTY_Cmd)  * num_commands;
    cmd_list->vtxLength = num_vertices;
    cmd_list->vtxMax    = sizeof(MTY_Vtx)  * num_vertices;
    cmd_list->idxLength = num_indices;
    cmd_list->idxMax    = sizeof(uint16_t) * num_indices;

    cmd_list->cmd->texture = texture ? texture : this->empty_texture;
    cmd_list->cmd->elemCount = num_indices;
    cmd_list->cmd->vtxOffset = 0;
    cmd_list->cmd->idxOffset = 0;

    cmd_list->cmd->clip.left   = this->scissor_active ? this->scissor.left   : 0;
    cmd_list->cmd->clip.top    = this->scissor_active ? this->scissor.top    : 0;
    cmd_list->cmd->clip.right  = this->scissor_active ? this->scissor.right  : this->data.displaySize.x;
    cmd_list->cmd->clip.bottom = this->scissor_active ? this->scissor.bottom : this->data.displaySize.y;

    for (size_t vtx_i = 0; vtx_i < num_vertices; vtx_i++) {
        char *col = (char *) &cmd_list->vtx[vtx_i].col;
        col[0] = vertices[vtx_i].colour.red;
        col[1] = vertices[vtx_i].colour.green;
        col[2] = vertices[vtx_i].colour.blue;
        col[3] = vertices[vtx_i].colour.alpha;

        cmd_list->vtx[vtx_i].pos.x = vertices[vtx_i].position.x + translation.x;
        cmd_list->vtx[vtx_i].pos.y = vertices[vtx_i].position.y + translation.y;
        cmd_list->vtx[vtx_i].uv.x  = vertices[vtx_i].tex_coord.x;
        cmd_list->vtx[vtx_i].uv.y  = vertices[vtx_i].tex_coord.y;
    }

    for (size_t idx_i = 0; idx_i < num_indices; idx_i++) {
        cmd_list->idx[idx_i] = (uint16_t) indices[idx_i];
    }

    refs.push_back((void *) cmd_list->cmd);
    refs.push_back((void *) cmd_list->vtx);
    refs.push_back((void *) cmd_list->idx);
}

void JUN_FrontRenderInterface::EnableScissorRegion(bool enable)
{
    this->scissor_active = enable;

    if (!this->scissor_active)
        this->scissor = {0};
}

void JUN_FrontRenderInterface::SetScissorRegion(int x, int y, int width, int height)
{
    this->scissor.left   = x;
    this->scissor.top    = y;
    this->scissor.right  = x + width;
    this->scissor.bottom = y + height;
}

bool JUN_FrontRenderInterface::GenerateTexture(TextureHandle& texture_handle, const byte* source, const Vector2i& source_dimensions)
{
    texture_handle = this->current;
    MTY_WindowSetUITexture(this->app, 0, texture_handle, source, source_dimensions.x, source_dimensions.y);
    this->current++;

    return true;
}

void JUN_FrontRenderInterface::ReleaseTexture(TextureHandle texture)
{
    MTY_WindowSetUITexture(this->app, 0, texture, NULL, 0, 0);
}