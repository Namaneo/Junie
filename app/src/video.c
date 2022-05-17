#include <string.h>

#include "filesystem.h"
#include "texture.h"

#include "video.h"

#include "ui_index.h"
#include "res_menu.h"
#include "res_loading.h"
#include "res_controller_left.h"
#include "res_controller_right.h"

struct jun_video_asset {
	void *data;
	uint32_t width;
	uint32_t height;
};

struct JUN_Video {
	MTY_App *app;
	MTY_Renderer *renderer;

	JUN_State *state;

	JUN_VideoCallback callback;
	void *opaque;

	struct jun_video_asset assets[CONTROLLER_MAX];

	MTY_ColorFormat pixel_format;
	unsigned bits_per_pixel;

	void *buffer;
	unsigned width;
	unsigned height;
	size_t pitch;

	unsigned view_width;
	unsigned view_height;

	JUN_Texture *ui;
};

JUN_Video *JUN_VideoCreate(JUN_State *state, MTY_AppFunc app_func, MTY_EventFunc event_func)
{
	JUN_Video *this = MTY_Alloc(1, sizeof(JUN_Video));

	this->state = state;

	MTY_WindowDesc description = {0};
	description.title = "Junie";
	description.api = MTY_GFX_GL;
	description.width = 800;
	description.height = 600;

	struct jun_video_asset *asset = NULL;

	asset = &this->assets[CONTROLLER_MENU];
	asset->data = MTY_DecompressImage(res_menu_png, res_menu_png_len, &asset->width, &asset->height);

	asset = &this->assets[CONTROLLER_LEFT];
	asset->data = MTY_DecompressImage(res_controller_left_png, res_controller_left_png_len, &asset->width, &asset->height);

	asset = &this->assets[CONTROLLER_RIGHT];
	asset->data = MTY_DecompressImage(res_controller_right_png, res_controller_right_png_len, &asset->width, &asset->height);

	asset = &this->assets[LOADING_SCREEN];
	asset->data = MTY_DecompressImage(res_loading_png, res_loading_png_len, &asset->width, &asset->height);

	this->app = MTY_AppCreate(app_func, event_func, this);

	MTY_WindowCreate(this->app, &description);
	MTY_WindowMakeCurrent(this->app, 0, true);
	MTY_WindowSetGFX(this->app, 0, MTY_GFX_GL, false);

	this->renderer = MTY_RendererCreate();

	return this;
}

static void jun_video_on_webview_created(MTY_Webview *ctx, void *opaque)
{
	JUN_Video *this = opaque;

	this->callback(ctx, this->opaque);

	char *index = MTY_Alloc(___ui_build_index_html_len + 1, 1);
	memcpy(index, ___ui_build_index_html, ___ui_build_index_html_len);

	MTY_WebviewNavigateHTML(ctx, index);

	MTY_Free(index);
}

void JUN_VideoCreateUI(JUN_Video *this, JUN_VideoCallback callback, void *opaque)
{
	this->callback = callback;
	this->opaque = opaque;

	MTY_Webview *webview = MTY_WindowCreateWebview(this->app, 0);
	MTY_WebviewAutomaticSize(webview, true);
	MTY_WebviewShow(webview, jun_video_on_webview_created);
}

static void refresh_viewport_size(JUN_Video *this, uint32_t *view_width, uint32_t *view_height)
{
	MTY_WindowGetSize(this->app, 0, view_width, view_height);
	JUN_StateSetWindowMetrics(this->state, *view_width, *view_height);
}

void JUN_VideoStart(JUN_Video *this)
{
	MTY_AppRun(this->app);
}

bool JUN_VideoSetPixelFormat(JUN_Video *this, enum retro_pixel_format *format)
{
	switch (*format) {
		case RETRO_PIXEL_FORMAT_0RGB1555:
			this->pixel_format = MTY_COLOR_FORMAT_BGRA5551;
			this->bits_per_pixel = sizeof(uint16_t);
			return true;
		case RETRO_PIXEL_FORMAT_XRGB8888:
			this->pixel_format = MTY_COLOR_FORMAT_RGBA;
			this->bits_per_pixel = sizeof(uint32_t);
			return true;
		case RETRO_PIXEL_FORMAT_RGB565:
			this->pixel_format = MTY_COLOR_FORMAT_BGR565;
			this->bits_per_pixel = sizeof(uint16_t);
			return true;
		default:
			return false;
	}
}

static void set_texture_metrics(JUN_Video *this, JUN_TextureType type, uint32_t view_width, uint32_t view_height)
{
	// Declare variables
	float x = 0, y = 0, width = 0, height = 0;

	// Retrieve controller files
	struct jun_video_asset *asset = &this->assets[type];

	// Create textures on first call
	if (!MTY_WindowHasUITexture(this->app, 0, type + 1))
		MTY_WindowSetUITexture(this->app, 0, type + 1, asset->data, asset->width, asset->height);

	// Compute file aspect ratio
	float aspect_ratio = (float) asset->width / (float) asset->height;

	// Deduce real image width and height
	width = view_width / 2.0f;
	height = width / aspect_ratio;

	// Scale the other way if the image height is too big
	if (height > view_height) {
		height = view_height;
		width = height * aspect_ratio;
	}

	// Position the final image
	switch (type) {
		case CONTROLLER_MENU:
			x = view_width / 2 - width / 2;
			y = 0;
			break;
		case CONTROLLER_LEFT:
			x = 0;
			y = view_height - height;
			break;
		case CONTROLLER_RIGHT:
			x = view_width - width;
			y = view_height - height;
			break;
		case LOADING_SCREEN:
			x = view_width / 2 - width / 2;
			y = view_height / 2 - height / 2;
			break;
		default:
			break;
	}

	// Set texture metrics
	JUN_StateSetMetrics(this->state, & (JUN_TextureData) {
		.id = type,
		.x = x,
		.y = y,
		.width = width,
		.height = height,
		.image_width = asset->width,
		.image_height = asset->height,
	});
}

static void update_ui_context(JUN_Video *this)
{
	// Update texture metrics
	set_texture_metrics(this, CONTROLLER_MENU, this->view_width, this->view_height);
	set_texture_metrics(this, CONTROLLER_LEFT, this->view_width, this->view_height);
	set_texture_metrics(this, CONTROLLER_RIGHT, this->view_width, this->view_height);

	// Destroy previous textures
	if (this->ui)
		JUN_TextureDestroy(&this->ui);

	// Create texture context
	this->ui = JUN_TextureCreateContext(this->view_width, this->view_height, 1);

	// Draw all textures
	JUN_TextureDraw(this->ui, JUN_StateGetMetrics(this->state, CONTROLLER_MENU));
	JUN_TextureDraw(this->ui, JUN_StateGetMetrics(this->state, CONTROLLER_LEFT));
	JUN_TextureDraw(this->ui, JUN_StateGetMetrics(this->state, CONTROLLER_RIGHT));
}

void JUN_VideoUpdateContext(JUN_Video *this, unsigned width, unsigned height, size_t pitch)
{
	if (this->width != width || this->height != height || this->pitch != pitch)
	{
		MTY_Log("%u x %u (%zu)", width, height, pitch);

		if (this->buffer)
			MTY_Free(this->buffer);

		this->width = width;
		this->height = height;
		this->pitch = pitch;
		this->buffer = MTY_Alloc(this->width * this->bits_per_pixel * this->height, 1);

		JUN_StateSetFrameMetrics(this->state, this->width, this->height);
	}

	uint32_t view_width, view_height;
	refresh_viewport_size(this, &view_width, &view_height);

	if (this->view_width != view_width || this->view_height != view_height) {
		this->view_width = view_width;
		this->view_height = view_height;

		update_ui_context(this);
	}
}

void JUN_VideoDrawFrame(JUN_Video *this, const void *data)
{
	// Deduce the real pitch of the image
	unsigned real_pitch = this->width * this->bits_per_pixel;

	// Crop the image to its real size
	for (int y = 0; y < this->height; ++y)
		memcpy(this->buffer + y * real_pitch, data + y * this->pitch, real_pitch);

	// In case of RGBA color format, manually swap R and B
	if (this->pixel_format == MTY_COLOR_FORMAT_RGBA) {
		char *byte_array = this->buffer;

		for (int i = 0; i < real_pitch * this->height; i += this->bits_per_pixel) {
			char bak = byte_array[i + 0];
			byte_array[i + 0] = byte_array[i + 2];
			byte_array[i + 2] = bak;
		}
	}

	// Initialize rendering descriptor
	MTY_RenderDesc description = {0};
	description.format = this->pixel_format;
	description.cropWidth = this->width;
	description.cropHeight = this->height;
	description.aspectRatio = (float)this->width / (float)this->height;

	refresh_viewport_size(this, &description.viewWidth, &description.viewHeight);

	// Compute height offset to give some space to the menu
	uint32_t offset = description.viewWidth * 0.1f;

	// Position the frame on top of the screen based on the ratios
	float view_ratio = (float)description.viewWidth / ((float)description.viewHeight - offset);
	if (view_ratio < description.aspectRatio)
	{
		description.type = MTY_POSITION_FIXED;
		description.position.y = description.viewHeight - description.viewWidth / description.aspectRatio - offset;
	}

	// Draw the frame to the screen
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
	// Produce drawing data
	MTY_DrawData *draw_data = JUN_TextureProduce(this->ui, !has_gamepad);

	// Draw the controller
	MTY_WindowDrawUI(this->app, 0, draw_data);
}

void JUN_VideoDrawLoadingScreen(JUN_Video *this)
{
	// Get window metrics
	uint32_t view_width, view_height;
	refresh_viewport_size(this, &view_width, &view_height);

	// Create texture context
	JUN_Texture *textures = JUN_TextureCreateContext(view_width, view_height, 1);

	// Set loading screen metrics
	set_texture_metrics(this, LOADING_SCREEN, view_width, view_height);

	// Draw the menu
	JUN_TextureDraw(textures, JUN_StateGetMetrics(this->state, LOADING_SCREEN));

	// Produce drawing data
	MTY_DrawData *draw_data = JUN_TextureProduce(textures, 0);

	// Draw the controller
	MTY_WindowDrawUI(this->app, 0, draw_data);

	// Release texture resources
	JUN_TextureDestroy(&textures);
}

void JUN_VideoPresent(JUN_Video *this)
{
	MTY_WindowPresent(this->app, 0, 1);
}

void JUN_VideoDestroy(JUN_Video **video)
{
	if (!video || !*video)
		return;

	JUN_Video *this = *video;

	MTY_RendererDestroy(&this->renderer);
	MTY_AppDestroy(&this->app);

	MTY_Free(this->assets[CONTROLLER_MENU].data);
	MTY_Free(this->assets[CONTROLLER_LEFT].data);
	MTY_Free(this->assets[CONTROLLER_RIGHT].data);
	MTY_Free(this->assets[LOADING_SCREEN].data);

	MTY_Free(this);
	*video = NULL;
}
