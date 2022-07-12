#include <string.h>

#include "filesystem.h"
#include "texture.h"
#include "interop.h"

#include "video.h"

#include "res_index.h"
#include "res_inputs.h"

#define TOP(margin)    .pos_y = JUN_POSITION_TOP,    .margin_y = margin
#define RIGHT(margin)  .pos_x = JUN_POSITION_RIGHT,  .margin_x = margin
#define BOTTOM(margin) .pos_y = JUN_POSITION_BOTTOM, .margin_y = margin
#define LEFT(margin)   .pos_x = JUN_POSITION_LEFT,   .margin_x = margin
#define CENTER(margin) .pos_x = JUN_POSITION_CENTER, .margin_x = margin
#define MIDDLE(margin) .pos_y = JUN_POSITION_MIDDLE, .margin_y = margin
#define RADIUS(value)  .radius = value
#define DRAW(id, res, ...) draw_input(this, id, res_##res##_png, res_##res##_png_len, & (struct jun_draw_desc) { __VA_ARGS__ } )

enum jun_position {
	JUN_POSITION_TOP,
	JUN_POSITION_RIGHT,
	JUN_POSITION_BOTTOM,
	JUN_POSITION_LEFT,
	JUN_POSITION_CENTER,
	JUN_POSITION_MIDDLE,
};

struct jun_draw_desc {
	enum jun_position pos_x;
	enum jun_position pos_y;
	double margin_x;
	double margin_y;
	double radius;
};

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

	MTY_Time before_run;
    MTY_Time after_run;
    float remaining_frames;
};

JUN_Video *JUN_VideoCreate(JUN_State *state, JUN_Input *input, MTY_AppFunc app_func, MTY_EventFunc event_func)
{
	JUN_Video *this = MTY_Alloc(1, sizeof(JUN_Video));

	this->state = state;
	this->input = input;

	this->app = MTY_AppCreate(app_func, event_func, this);

	MTY_WindowCreate(this->app, "Junie", NULL, 0);
	MTY_WindowSetGFX(this->app, 0, MTY_GFX_GL, true);
	MTY_WindowMakeCurrent(this->app, 0, true);

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
	MTY_Size size = MTY_WindowGetSize(this->app, 0);
	*view_width = size.w;
	*view_height = size.h;

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

static void draw_input(JUN_Video *this, uint8_t id, const void *data, size_t size, struct jun_draw_desc *desc) 
{
    uint32_t image_width = 0, image_height = 0;
    void *rgba = MTY_DecompressImage(data, size, &image_width, &image_height);
    MTY_WindowSetUITexture(this->app, 0, id + 1, rgba, image_width, image_height);
    MTY_Free(rgba);

	double pixel_ratio = JUN_InteropGetPixelRatio();
	double aspect_ratio = (double) image_width / (double) image_height;

	double reference_x =
		desc->pos_x == JUN_POSITION_LEFT   ? 0 :
		desc->pos_x == JUN_POSITION_RIGHT  ? this->view_width :
		desc->pos_x == JUN_POSITION_CENTER ? this->view_width / 2.0 :
		0;

	double reference_y =
		desc->pos_y == JUN_POSITION_TOP    ? 0 :
		desc->pos_y == JUN_POSITION_BOTTOM ? this->view_height :
		desc->pos_y == JUN_POSITION_MIDDLE ? this->view_height / 2.0 :
		0;

	double width = desc->radius * 2.0 * pixel_ratio;
	double height = width / aspect_ratio;
	double x = reference_x + desc->margin_x * pixel_ratio;
	double y = reference_y + desc->margin_y * pixel_ratio;

	JUN_TextureData texture = {
		.id = id,
		.x = x - width / 2.0,
		.y = y - height / 2.0,
		.width = width,
		.height = height,
		.image_width =  image_width,
		.image_height = image_height,
	};

	JUN_StateSetMetrics(this->state, &texture);
    JUN_TextureDraw(this->ui, &texture);
	JUN_InputMapTouch(this->input, id, x, y, desc->radius * pixel_ratio * 1.5);
}

static void update_ui_context(JUN_Video *this)
{
	if (this->ui)
		JUN_TextureDestroy(&this->ui);

	this->ui = JUN_TextureCreate(this->view_width, this->view_height);

	JUN_InputSetCallback(this->input, MENU_TOGGLE_AUDIO,   JUN_StateToggleAudio);
	JUN_InputSetCallback(this->input, MENU_TOGGLE_GAMEPAD, JUN_StateToggleGamepad);
	JUN_InputSetCallback(this->input, MENU_SAVE_STATE,     JUN_StateToggleSaveState);
	JUN_InputSetCallback(this->input, MENU_RESTORE_STATE,  JUN_StateToggleRestoreState);
	JUN_InputSetCallback(this->input, MENU_FAST_FORWARD,   JUN_StateToggleFastForward);
	JUN_InputSetCallback(this->input, MENU_EXIT,           JUN_StateToggleExit);

	DRAW(MENU_TOGGLE_AUDIO,   menu_toggle_audio,   CENTER(-150), TOP(25), RADIUS(20));
	DRAW(MENU_TOGGLE_GAMEPAD, menu_toggle_gamepad, CENTER(-90),  TOP(25), RADIUS(20));
	DRAW(MENU_SAVE_STATE,     menu_save_state,     CENTER(-30),  TOP(25), RADIUS(20));
	DRAW(MENU_RESTORE_STATE,  menu_restore_state,  CENTER(30),   TOP(25), RADIUS(20));
	DRAW(MENU_FAST_FORWARD,   menu_fast_forward,   CENTER(90),   TOP(25), RADIUS(20));
	DRAW(MENU_EXIT,           menu_exit,           CENTER(150),  TOP(25), RADIUS(20));

	DRAW(RETRO_DEVICE_ID_JOYPAD_UP,    joypad_up,    LEFT(100), BOTTOM(-200), RADIUS(30));
	DRAW(RETRO_DEVICE_ID_JOYPAD_DOWN,  joypad_down,  LEFT(100), BOTTOM(-100), RADIUS(30));
	DRAW(RETRO_DEVICE_ID_JOYPAD_LEFT,  joypad_left,  LEFT(50),  BOTTOM(-150), RADIUS(30));
	DRAW(RETRO_DEVICE_ID_JOYPAD_RIGHT, joypad_right, LEFT(150), BOTTOM(-150), RADIUS(30));
	DRAW(RETRO_DEVICE_ID_JOYPAD_L,     joypad_l,     LEFT(75),  BOTTOM(-300), RADIUS(60));

	DRAW(RETRO_DEVICE_ID_JOYPAD_X, joypad_x, RIGHT(-100), BOTTOM(-200), RADIUS(30));
	DRAW(RETRO_DEVICE_ID_JOYPAD_B, joypad_b, RIGHT(-100), BOTTOM(-100), RADIUS(30));
	DRAW(RETRO_DEVICE_ID_JOYPAD_A, joypad_a, RIGHT(-50),  BOTTOM(-150), RADIUS(30));
	DRAW(RETRO_DEVICE_ID_JOYPAD_Y, joypad_y, RIGHT(-150), BOTTOM(-150), RADIUS(30));
	DRAW(RETRO_DEVICE_ID_JOYPAD_R, joypad_r, RIGHT(-75),  BOTTOM(-300), RADIUS(60));

	DRAW(RETRO_DEVICE_ID_JOYPAD_START,  joypad_start_select, CENTER(20),  BOTTOM(-40), RADIUS(20));
	DRAW(RETRO_DEVICE_ID_JOYPAD_SELECT, joypad_start_select, CENTER(-20), BOTTOM(-40), RADIUS(20));
}

void JUN_VideoUpdateContext(JUN_Video *this, unsigned width, unsigned height, size_t pitch)
{
	if (this->width != width || this->height != height || this->pitch != pitch) {
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

	refresh_viewport_size(this, &description.viewWidth, &description.viewHeight);

	// Compute height offset to give some space to the menu
	uint32_t offset = 50 * JUN_InteropGetPixelRatio();

	// Position the frame on top of the screen based on the ratios
	float scale_w = (float) description.viewWidth / (float) this->width;
	float scale_h = (float) (description.viewHeight - offset) / (float) this->height;
	description.position = MTY_POSITION_FIXED;
	description.imageY = offset;
	description.imageX = scale_w < scale_h ? 0 : (description.viewWidth - this->width * scale_h) / 2;
	description.scale = scale_w < scale_h ? scale_w : scale_h;

	MTY_WindowDrawQuad(this->app, 0, this->buffer, &description);
}

void JUN_VideoDrawUI(JUN_Video *this, bool has_gamepad)
{
	// Produce drawing data
	MTY_DrawData *draw_data = JUN_TextureProduce(this->ui, !has_gamepad ? 6 : 0);

	// Draw the controller
	MTY_WindowDrawUI(this->app, 0, draw_data);
}

uint32_t JUN_VideoComputeFramerate(JUN_Video *this)
{
	MTY_Time before_run = MTY_GetTime();

    float total_loop = MTY_TimeDiff(this->before_run, before_run);
    float time_run = MTY_TimeDiff(this->before_run, this->after_run);
    float time_idle = MTY_TimeDiff(this->after_run, before_run);

    this->before_run = before_run;

    bool throttling = time_run > time_idle;
	float framerate = 1000.0 / total_loop;

	this->remaining_frames += 60.0f / framerate;
	uint32_t pending = (uint32_t) this->remaining_frames;
	this->remaining_frames -= (float) pending;

	return pending <= 20 && !throttling ? pending : 1;
}

void JUN_VideoPresent(JUN_Video *this)
{
	this->after_run = MTY_GetTime();

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
