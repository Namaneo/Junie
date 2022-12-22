#include <string.h>

#include "formats/image.h"
#include "formats/rpng.h"

#include "filesystem.h"
#include "texture.h"
#include "interop.h"

#include "video.h"

#include "res_inputs.h"

#define TOP(margin)    .pos_y = JUN_POSITION_TOP,    .margin_y = margin
#define RIGHT(margin)  .pos_x = JUN_POSITION_RIGHT,  .margin_x = margin
#define BOTTOM(margin) .pos_y = JUN_POSITION_BOTTOM, .margin_y = margin
#define LEFT(margin)   .pos_x = JUN_POSITION_LEFT,   .margin_x = margin
#define CENTER(margin) .pos_x = JUN_POSITION_CENTER, .margin_x = margin
#define MIDDLE(margin) .pos_y = JUN_POSITION_MIDDLE, .margin_y = margin
#define RADIUS(value)  .radius = value

#define PREPARE(id, res) prepare_asset(this, id, res_##res##_png, res_##res##_png_len)
#define DRAW(id, ...)    draw_input(this, id, & (struct jun_draw_desc) { __VA_ARGS__ } )

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
	uint32_t width;
	uint32_t height;
};

struct JUN_Video {
	MTY_EventFunc event;
	MTY_Renderer *renderer;
	MTY_Hash *assets;

	JUN_State *state;
	JUN_Input *input;

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

typedef void (*motion_func)(JUN_Video *this, int32_t id, bool relative, int32_t x, int32_t y);
typedef void (*button_func)(JUN_Video *this, int32_t id, bool pressed, int32_t button, int32_t x, int32_t y);

void gl_attach_events(JUN_Video *this, motion_func motion, button_func button);
void gl_get_size(uint32_t *width, uint32_t *height);
void gl_flush();

static void window_motion(JUN_Video *this, int32_t id, bool relative, int32_t x, int32_t y)
{
	MTY_Event evt = {0};
	evt.type = MTY_EVENT_MOTION;
	evt.motion.id = id;
	evt.motion.relative = relative;
	evt.motion.x = x * JUN_InteropGetPixelRatio();
	evt.motion.y = y * JUN_InteropGetPixelRatio();

	this->event(&evt, NULL);
}

static void window_button(JUN_Video *this, int32_t id, bool pressed, int32_t button, int32_t x, int32_t y)
{
	MTY_Event evt = {0};
	evt.type = MTY_EVENT_BUTTON;
	evt.button.id = id;
	evt.button.pressed = pressed;
	evt.button.button =
		button == 0 ? MTY_BUTTON_LEFT :
		button == 1 ? MTY_BUTTON_MIDDLE :
		button == 2 ? MTY_BUTTON_RIGHT :
		button == 3 ? MTY_BUTTON_X1 :
		button == 4 ? MTY_BUTTON_X2 :
		MTY_BUTTON_NONE;

	evt.button.x = x * JUN_InteropGetPixelRatio();
	evt.button.y = y * JUN_InteropGetPixelRatio();

	this->event(&evt, NULL);
}

JUN_Video *JUN_VideoCreate(JUN_State *state, JUN_Input *input, MTY_EventFunc event)
{
	JUN_Video *this = MTY_Alloc(1, sizeof(JUN_Video));

	this->event = event;
	this->state = state;
	this->input = input;

	gl_attach_events(this, window_motion, window_button);

	this->renderer = MTY_RendererCreate();
	this->assets = MTY_HashCreate(0);

	return this;
}

static void refresh_viewport_size(JUN_Video *this, uint32_t *view_width, uint32_t *view_height)
{
	gl_get_size(view_width, view_height);

	JUN_StateSetWindowMetrics(this->state, *view_width, *view_height);
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

static void prepare_asset(JUN_Video *this, uint8_t id, const void *data, size_t size)
{
	void *image = NULL;

	struct jun_video_asset *asset = MTY_Alloc(1, sizeof(struct jun_video_asset));

	rpng_t *png = rpng_alloc();
	rpng_set_buf_ptr(png, (void *) data, size);
	rpng_start(png);
	while (rpng_iterate_image(png));
	while (rpng_process_image(png, &image, size, &asset->width, &asset->height) == IMAGE_PROCESS_NEXT)

	MTY_HashSetInt(this->assets, id, asset);
	MTY_RendererSetUITexture(this->renderer, MTY_GFX_GL, NULL, NULL, id + 1, image, asset->width, asset->height);

	MTY_Free(image);
	rpng_free(png);
}

static void draw_input(JUN_Video *this, uint8_t id, struct jun_draw_desc *desc)
{
	struct jun_video_asset *asset = MTY_HashGetInt(this->assets, id);

	double pixel_ratio = JUN_InteropGetPixelRatio();
	double aspect_ratio = (double) asset->width / (double) asset->height;

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
		.image_width =  asset->width,
		.image_height = asset->height,
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

	DRAW(MENU_TOGGLE_AUDIO,   CENTER(-150), TOP(25), RADIUS(20));
	DRAW(MENU_TOGGLE_GAMEPAD, CENTER(-90),  TOP(25), RADIUS(20));
	DRAW(MENU_SAVE_STATE,     CENTER(-30),  TOP(25), RADIUS(20));
	DRAW(MENU_RESTORE_STATE,  CENTER(30),   TOP(25), RADIUS(20));
	DRAW(MENU_FAST_FORWARD,   CENTER(90),   TOP(25), RADIUS(20));
	DRAW(MENU_EXIT,           CENTER(150),  TOP(25), RADIUS(20));

	DRAW(RETRO_DEVICE_ID_JOYPAD_UP,    LEFT(100), BOTTOM(-200), RADIUS(30));
	DRAW(RETRO_DEVICE_ID_JOYPAD_DOWN,  LEFT(100), BOTTOM(-100), RADIUS(30));
	DRAW(RETRO_DEVICE_ID_JOYPAD_LEFT,  LEFT(50),  BOTTOM(-150), RADIUS(30));
	DRAW(RETRO_DEVICE_ID_JOYPAD_RIGHT, LEFT(150), BOTTOM(-150), RADIUS(30));
	DRAW(RETRO_DEVICE_ID_JOYPAD_L,     LEFT(75),  BOTTOM(-300), RADIUS(60));

	DRAW(RETRO_DEVICE_ID_JOYPAD_X, RIGHT(-100), BOTTOM(-200), RADIUS(30));
	DRAW(RETRO_DEVICE_ID_JOYPAD_B, RIGHT(-100), BOTTOM(-100), RADIUS(30));
	DRAW(RETRO_DEVICE_ID_JOYPAD_A, RIGHT(-50),  BOTTOM(-150), RADIUS(30));
	DRAW(RETRO_DEVICE_ID_JOYPAD_Y, RIGHT(-150), BOTTOM(-150), RADIUS(30));
	DRAW(RETRO_DEVICE_ID_JOYPAD_R, RIGHT(-75),  BOTTOM(-300), RADIUS(60));

	DRAW(RETRO_DEVICE_ID_JOYPAD_START,  CENTER(20),  BOTTOM(-40), RADIUS(20));
	DRAW(RETRO_DEVICE_ID_JOYPAD_SELECT, CENTER(-20), BOTTOM(-40), RADIUS(20));
}

void JUN_VideoStart(JUN_Video *this)
{
	PREPARE(MENU_TOGGLE_AUDIO,   menu_toggle_audio);
	PREPARE(MENU_TOGGLE_GAMEPAD, menu_toggle_gamepad);
	PREPARE(MENU_SAVE_STATE,     menu_save_state);
	PREPARE(MENU_RESTORE_STATE,  menu_restore_state);
	PREPARE(MENU_FAST_FORWARD,   menu_fast_forward);
	PREPARE(MENU_EXIT,           menu_exit);

	PREPARE(RETRO_DEVICE_ID_JOYPAD_UP,    joypad_up);
	PREPARE(RETRO_DEVICE_ID_JOYPAD_DOWN,  joypad_down);
	PREPARE(RETRO_DEVICE_ID_JOYPAD_LEFT,  joypad_left);
	PREPARE(RETRO_DEVICE_ID_JOYPAD_RIGHT, joypad_right);
	PREPARE(RETRO_DEVICE_ID_JOYPAD_L,     joypad_l);

	PREPARE(RETRO_DEVICE_ID_JOYPAD_X, joypad_x);
	PREPARE(RETRO_DEVICE_ID_JOYPAD_B, joypad_b);
	PREPARE(RETRO_DEVICE_ID_JOYPAD_A, joypad_a);
	PREPARE(RETRO_DEVICE_ID_JOYPAD_Y, joypad_y);
	PREPARE(RETRO_DEVICE_ID_JOYPAD_R, joypad_r);

	PREPARE(RETRO_DEVICE_ID_JOYPAD_START,  joypad_start_select);
	PREPARE(RETRO_DEVICE_ID_JOYPAD_SELECT, joypad_start_select);
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
	description.clear = true;

	refresh_viewport_size(this, &description.viewWidth, &description.viewHeight);
	description.displayWidth = description.viewWidth;
	description.displayHeight = description.viewHeight;

	// Compute height offset to give some space to the menu
	uint32_t offset = 50 * JUN_InteropGetPixelRatio();

	// Position the frame on top of the screen based on the ratios
	float scale_w = (float) description.viewWidth / (float) this->width;
	float scale_h = (float) (description.viewHeight - offset) / (float) this->height;
	description.position = MTY_POSITION_FIXED;
	description.imageY = offset;
	description.imageX = scale_w < scale_h ? 0 : (description.viewWidth - this->width * scale_h) / 2;
	description.scale = scale_w < scale_h ? scale_w : scale_h;

	MTY_RendererDrawQuad(this->renderer, MTY_GFX_GL, NULL, NULL, this->buffer, &description, NULL);
}

void JUN_VideoDrawUI(JUN_Video *this, bool has_gamepad)
{
	// Produce drawing data
	MTY_DrawData *draw_data = JUN_TextureProduce(this->ui, !has_gamepad ? 6 : 0);

	// Draw the controller
	MTY_RendererDrawUI(this->renderer, MTY_GFX_GL, NULL, NULL, draw_data, NULL);
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

	gl_flush();
}

void JUN_VideoDestroy(JUN_Video **video)
{
	if (!video || !*video)
		return;

	JUN_Video *this = *video;

	MTY_HashDestroy(&this->assets, MTY_Free);
	MTY_RendererDestroy(&this->renderer);

	MTY_Free(this);
	*video = NULL;
}
