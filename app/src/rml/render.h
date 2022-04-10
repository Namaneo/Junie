#pragma once

#include "matoya.h"

#define RMLUI_NO_THIRDPARTY_CONTAINERS
#define RMLUI_USE_CUSTOM_RTTI
#include "RmlUi/Core.h"

using namespace Rml;

class JunieRenderInterface : public RenderInterface
{
private:
    MTY_App *app;
    MTY_DrawData data;
    std::vector<void *> refs;

    bool scissor_active;
    MTY_Rect scissor;

    TextureHandle current = 1;
    TextureHandle empty_texture;

public:
    JunieRenderInterface(MTY_App *app);

    MTY_DrawData *GetData();
    void ClearData();

    void RenderGeometry(Vertex* vertices, int num_vertices, int* indices, int num_indices, TextureHandle texture, const Vector2f& translation) override;
    void EnableScissorRegion(bool enable) override;
    void SetScissorRegion(int x, int y, int width, int height) override;

    bool GenerateTexture(TextureHandle& texture_handle, const byte* source, const Vector2i& source_dimensions) override;
    void ReleaseTexture(TextureHandle texture) override;
};
