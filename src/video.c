#include <string.h>

#include "filesystem.h"
#include "texture.h"

#include "video.h"

struct JUN_Video
{
    MTY_App *app;
    MTY_Renderer *renderer;

    JUN_Input *input;

    char *assets[CONTROLLER_MAX];
    
    MTY_ColorFormat pixel_format;
    unsigned bits_per_pixel;

    void *buffer;
    unsigned width;
    unsigned height;
    size_t pitch;

    JUN_Texture *ui;   
};

JUN_Video *JUN_VideoInitialize(JUN_Input *input, MTY_AppFunc app_func, MTY_EventFunc event_func)
{
    JUN_Video *this = MTY_Alloc(1, sizeof(JUN_Video));

    this->input = input;

    MTY_WindowDesc description = {0};
	description.title = "Junie";
	description.api = MTY_GFX_GL;
	description.width = 800;
	description.height = 600;

    this->app = MTY_AppCreate(app_func, event_func, NULL);

	MTY_WindowCreate(this->app, &description);
	MTY_WindowMakeCurrent(this->app, 0, true);

    MTY_WindowSetGFX(this->app, 0, MTY_GFX_GL, false);

    this->renderer = MTY_RendererCreate();

    return this;
}

static void refresh_viewport_size(JUN_Video *this, uint32_t *view_width, uint32_t *view_height)
{
    MTY_WindowGetSize(this->app, 0, view_width, view_height);
    JUN_InputSetWindowMetrics(this->input, *view_width, *view_height);
}

void JUN_VideoStart(JUN_Video *this)
{
    MTY_AppRun(this->app);
}

void JUN_VideoSetAssets(JUN_Video *this, JUN_TextureType type, const char *base_path, const char *file_name)
{
    this->assets[type] = MTY_SprintfD("%s/%s", base_path, file_name);
    JUN_FilesystemDownload(this->assets[type],  NULL, NULL);
}

bool JUN_VideoSetPixelFormat(JUN_Video *this, enum retro_pixel_format *format)
{
    if (*format == RETRO_PIXEL_FORMAT_0RGB1555)
    {
        this->pixel_format = MTY_COLOR_FORMAT_BGRA5551;
        this->bits_per_pixel = sizeof(uint16_t);

        return true;
    }

    if (*format == RETRO_PIXEL_FORMAT_XRGB8888)
    {
        this->pixel_format = MTY_COLOR_FORMAT_RGBA;
        this->bits_per_pixel = sizeof(uint32_t);

        return true;
    }

    if (*format == RETRO_PIXEL_FORMAT_RGB565)
    {
        this->pixel_format = MTY_COLOR_FORMAT_BGR565;
        this->bits_per_pixel = sizeof(uint16_t);

        return true;
    }

    return false;
}

void JUN_VideoUpdateContext(JUN_Video *this, unsigned width, unsigned height, size_t pitch)
{
    if (this->width != width || this->height != height || this->pitch != pitch)
    {
        MTY_Log("%u x %u (%zu)", width, height, pitch);

        if (this->buffer)
        {
            MTY_Free(this->buffer);
        }
    
        this->width = width;
        this->height = height;
        this->pitch = pitch;
        this->buffer = MTY_Alloc(this->width * this->bits_per_pixel * this->height, 1);

        JUN_InputSetFrameMetrics(this->input, this->width, this->height);

        JUN_VideoUpdateUI(this);
    }
}

static void set_texture_metrics(JUN_Video *this, JUN_TextureType type, uint32_t view_width, uint32_t view_height)
{
    //Declare variables
    float x, y, width, height;

    //Retrieve controller files
    JUN_File *file  = JUN_FilesystemGet(this->assets[type], true);
    if (!file)
        return;

    //Create textures on first call
    if (!MTY_WindowHasUITexture(this->app, 0, type + 1))
        MTY_WindowSetUITexture(this->app, 0, type + 1, file->buffer, file->width, file->height);

    //Compute file aspect ratio
    float aspect_ratio = (float)file->width / (float)file->height;

    //Deduce real image width and height
    width = view_width / 2.0f;
    height = width / aspect_ratio;

    //Scale the other way if the image height is too big 
    if (height > view_height)
    {
        height = view_height;
        width = height * aspect_ratio;
    }

    //Position the final image
    if (type == CONTROLLER_MENU)
    {
        x = view_width / 2 - width / 2;
        y = 0;
    }
    if (type == CONTROLLER_LEFT)
    {
        x = 0;
        y = view_height - height;
    }
    if (type == CONTROLLER_RIGHT)
    {
        x = view_width  - width;
        y = view_height - height;
    }
    if (type == LOADING_SCREEN)
    {
        x = view_width / 2  - width / 2;
        y = view_height / 2 - height / 2;
    }

    //Set texture metrics
    JUN_InputSetMetrics(this->input, &(JUN_TextureData)
    {
        .id           = type,
        .x            = x,
        .y            = y,
        .width        = width,
        .height       = height,
        .image_width  = file->width,
        .image_height = file->height,
    });
}

void JUN_VideoUpdateUI(JUN_Video *this)
{
    //Get window metrics
    uint32_t view_width, view_height;
    refresh_viewport_size(this, &view_width, &view_height);

    //Update texture metrics
    set_texture_metrics(this, CONTROLLER_MENU,  view_width, view_height);
    set_texture_metrics(this, CONTROLLER_LEFT,  view_width, view_height);
    set_texture_metrics(this, CONTROLLER_RIGHT, view_width, view_height);

    //Destroy previous textures
    if (this->ui)
        JUN_TextureDestroy(&this->ui);

    //Create texture context
    this->ui = JUN_TextureCreateContext(view_width, view_height, 1);

    //Draw all textures
    JUN_TextureDraw(this->ui, JUN_InputGetMetrics(this->input, CONTROLLER_MENU));
    JUN_TextureDraw(this->ui, JUN_InputGetMetrics(this->input, CONTROLLER_LEFT));
    JUN_TextureDraw(this->ui, JUN_InputGetMetrics(this->input, CONTROLLER_RIGHT));
}

void JUN_VideoDrawFrame(JUN_Video *this, const void *data)
{
    //Deduce the real pitch of the image
    unsigned real_pitch = this->width * this->bits_per_pixel;

    //Crop the image to its real size
    for (int y = 0; y < this->height; ++y)
    {
        memcpy(this->buffer + y * real_pitch, data + y * this->pitch, real_pitch);
    }

    //In case of RGBA color format, manually swap R and B
    if (this->pixel_format == MTY_COLOR_FORMAT_RGBA)
    {
        char *byte_array = this->buffer;
        for (int i = 0; i < real_pitch * this->height; i += this->bits_per_pixel)
        {
            char bak = byte_array[i + 0];
            byte_array[i + 0] = byte_array[i + 2];
            byte_array[i + 2] = bak;
        }
    }

    //Initialize rendering descriptor
    MTY_RenderDesc description = {0};
    description.format = this->pixel_format;
    description.cropWidth = this->width;
    description.cropHeight = this->height;
    description.aspectRatio = (float)this->width / (float)this->height;

    refresh_viewport_size(this, &description.viewWidth, &description.viewHeight);

    //Compute height offset to give some space to the menu
    uint32_t offset = description.viewWidth * 0.1f;

    //Position the frame on top of the screen based on the ratios
    float view_ratio = (float)description.viewWidth / ((float)description.viewHeight - offset);
    if (view_ratio < description.aspectRatio)
    {
        description.type = MTY_POSITION_FIXED;
        description.position.y = description.viewHeight - description.viewWidth / description.aspectRatio - offset;
    }

    //Draw the frame to the screen
    MTY_WindowGetSize(this->app, 0, &description.viewWidth, &description.viewHeight);
    MTY_RendererDrawQuad(this->renderer, 
        MTY_WindowGetGFX(this->app, 0),
        MTY_WindowGetDevice(this->app, 0),
        MTY_WindowGetContext(this->app, 0),
        this->buffer, &description,
        MTY_WindowGetSurface(this->app, 0)
    );
}

void JUN_VideoDrawUI(JUN_Video *this, bool has_gamepad)
{
    //Produce drawing data
    MTY_DrawData *draw_data = JUN_TextureProduce(this->ui, !has_gamepad);

    //Draw the controller
    MTY_WindowDrawUI(this->app, 0, draw_data);
}

void JUN_VideoDrawLoadingScreen(JUN_Video *this)
{
    //Get window metrics
    uint32_t view_width, view_height; 
    refresh_viewport_size(this, &view_width, &view_height);

    //Create texture context
    JUN_Texture *textures = JUN_TextureCreateContext(view_width, view_height, 1);

    //Set loading screen metrics
    set_texture_metrics(this, LOADING_SCREEN, view_width, view_height);

    //Draw the menu
    JUN_TextureDraw(textures, JUN_InputGetMetrics(this->input, LOADING_SCREEN));

    //Produce drawing data
    MTY_DrawData *draw_data = JUN_TextureProduce(textures, 0);

    //Draw the controller
    MTY_WindowDrawUI(this->app, 0, draw_data);

    //Release texture resources
    JUN_TextureDestroy(&textures);
}

void JUN_VideoPresent(JUN_Video *this)
{
    MTY_WindowPresent(this->app, 0, 1);
}

void JUN_VideoDestroy(JUN_Video **this)
{
    MTY_RendererDestroy(&(*this)->renderer);
    MTY_AppDestroy(&(*this)->app);

    MTY_Free(*this);
    *this = NULL;
}
