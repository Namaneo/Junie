#include <string.h>

#include "filesystem.h"
#include "texture.h"
#include "interop.h"

#include "video.h"

#include "res_index.h"
#include "res_inputs.h"

struct jun_video_asset {
	void *data;
	uint32_t width;
	uint32_t height;
};

struct JUN_Video {
	MTY_App *app;
	MTY_Renderer *renderer;

	JUN_State *state;
	JUN_Input *input;

	JUN_VideoCallback callback;
	void *opaque;

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

JUN_Video *JUN_VideoCreate(JUN_State *state, JUN_Input *input, MTY_AppFunc app_func, MTY_EventFunc event_func)
{
	JUN_Video *this = MTY_Alloc(1, sizeof(JUN_Video));

	this->state = state;
	this->input = input;

	MTY_WindowDesc description = {0};
	description.title = "Junie";
	description.api = MTY_GFX_GL;
	description.width = 800;
	description.height = 600;

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

	char *index = MTY_Alloc(index_html_len + 1, 1);
	memcpy(index, index_html, index_html_len);

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

static void draw_input(JUN_Video *this, uint8_t id, const void *data, size_t size, double x, double y, double radius) 
{
    uint32_t image_width = 0, image_height = 0;
    void *rgba = MTY_DecompressImage(data, size, &image_width, &image_height);
    MTY_WindowSetUITexture(this->app, 0, id + 1, rgba, image_width, image_height);
    MTY_Free(rgba);

	double aspect_ratio = (double) image_width / (double) image_height;

	double height = this->view_height * radius / 50.0;
	double width = height * aspect_ratio;
	double real_x = this->view_width * x / 100.0;
	double real_y = this->view_height * y / 100.0;

	JUN_TextureData texture = {
		.id = id,
		.x = real_x - width / 2,
		.y = real_y - height / 2,
		.width = width,
		.height = height,
		.image_width =  image_width,
		.image_height = image_height,
	};

	JUN_StateSetMetrics(this->state, &texture);
    JUN_TextureDraw(this->ui, &texture);
	JUN_InputMapTouch(this->input, id, real_x, real_y, width / 2);
}

static void update_ui_context(JUN_Video *this)
{
	// Destroy previous textures
	if (this->ui)
		JUN_TextureDestroy(&this->ui);

	// Create texture context
	this->ui = JUN_TextureCreate(this->view_width, this->view_height);

	JUN_InputSetCallback(this->input, MENU_TOGGLE_AUDIO,   JUN_StateToggleAudio);
	JUN_InputSetCallback(this->input, MENU_TOGGLE_GAMEPAD, JUN_StateToggleGamepad);
	JUN_InputSetCallback(this->input, MENU_SAVE_STATE,     JUN_StateToggleSaveState);
	JUN_InputSetCallback(this->input, MENU_RESTORE_STATE,  JUN_StateToggleRestoreState);
	JUN_InputSetCallback(this->input, MENU_FAST_FORWARD,   JUN_StateToggleFastForward);
	JUN_InputSetCallback(this->input, MENU_EXIT,           JUN_StateToggleExit);

	draw_input(this, MENU_TOGGLE_AUDIO,   res_menu_toggle_audio_png,   res_menu_toggle_audio_png_len,   15, 5, 5);
	draw_input(this, MENU_TOGGLE_GAMEPAD, res_menu_toggle_gamepad_png, res_menu_toggle_gamepad_png_len, 29, 5, 5);
	draw_input(this, MENU_SAVE_STATE,     res_menu_save_state_png,     res_menu_save_state_png_len,     43, 5, 5);
	draw_input(this, MENU_RESTORE_STATE,  res_menu_restore_state_png,  res_menu_restore_state_png_len,  57, 5, 5);
	draw_input(this, MENU_FAST_FORWARD,   res_menu_fast_forward_png,   res_menu_fast_forward_png_len,   71, 5, 5);
	draw_input(this, MENU_EXIT,           res_menu_exit_png,           res_menu_exit_png_len,           85, 5, 5);

	draw_input(this, RETRO_DEVICE_ID_JOYPAD_A,      res_joypad_a_png,            res_joypad_a_png_len,            65, 80, 5);
	draw_input(this, RETRO_DEVICE_ID_JOYPAD_B,      res_joypad_b_png,            res_joypad_b_png_len,            80, 75, 5);
	draw_input(this, RETRO_DEVICE_ID_JOYPAD_X,      res_joypad_x_png,            res_joypad_x_png_len,            65, 70, 5);
	draw_input(this, RETRO_DEVICE_ID_JOYPAD_Y,      res_joypad_y_png,            res_joypad_y_png_len,            60, 75, 5);
	draw_input(this, RETRO_DEVICE_ID_JOYPAD_L,      res_joypad_l_png,            res_joypad_l_png_len,            20, 55, 5);
	draw_input(this, RETRO_DEVICE_ID_JOYPAD_R,      res_joypad_r_png,            res_joypad_r_png_len,            80, 55, 5);
	draw_input(this, RETRO_DEVICE_ID_JOYPAD_UP,     res_joypad_up_png,           res_joypad_up_png_len,           25, 70, 5);
	draw_input(this, RETRO_DEVICE_ID_JOYPAD_DOWN,   res_joypad_down_png,         res_joypad_down_png_len,         25, 80, 5);
	draw_input(this, RETRO_DEVICE_ID_JOYPAD_LEFT,   res_joypad_left_png,         res_joypad_left_png_len,         10, 75, 5);
	draw_input(this, RETRO_DEVICE_ID_JOYPAD_RIGHT,  res_joypad_right_png,        res_joypad_right_png_len,        40, 75, 5);
	draw_input(this, RETRO_DEVICE_ID_JOYPAD_START,  res_joypad_start_select_png, res_joypad_start_select_png_len, 45, 90, 5);
	draw_input(this, RETRO_DEVICE_ID_JOYPAD_SELECT, res_joypad_start_select_png, res_joypad_start_select_png_len, 55, 90, 5);
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
	MTY_DrawData *draw_data = JUN_TextureProduce(this->ui, !has_gamepad ? 6 : 0);

	// Draw the controller
	MTY_WindowDrawUI(this->app, 0, draw_data);
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

	MTY_Free(this);
	*video = NULL;
}
