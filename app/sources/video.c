#include <string.h>
#include <SDL2/SDL.h>
#include <SDL2/SDL_image.h>

#include "filesystem.h"

#include "video.h"

#define TOP(margin)    .pos_y = JUN_POSITION_TOP,    .margin_y = margin
#define RIGHT(margin)  .pos_x = JUN_POSITION_RIGHT,  .margin_x = margin
#define BOTTOM(margin) .pos_y = JUN_POSITION_BOTTOM, .margin_y = margin
#define LEFT(margin)   .pos_x = JUN_POSITION_LEFT,   .margin_x = margin
#define CENTER(margin) .pos_x = JUN_POSITION_CENTER, .margin_x = margin
#define MIDDLE(margin) .pos_y = JUN_POSITION_MIDDLE, .margin_y = margin
#define RADIUS(value)  .radius = value

#define PREPARE(id, cat, res) prepare_asset(this, id, "assets/" cat "/" res ".png", !strcmp(cat, "menu"))
#define DRAW(id, ...) draw_input(this, id, & (struct jun_draw_desc) { __VA_ARGS__ } )

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
	SDL_Surface *image;
	SDL_Texture *texture;
	SDL_Rect layout;
	bool menu;
};

struct JUN_Video {
	SDL_Window *window;
	SDL_Renderer *renderer;
	struct jun_video_asset assets[JUN_MENU_MAX];

	JUN_State *state;
	JUN_Input *input;

	SDL_Texture *texture;
	SDL_PixelFormatEnum pixel_format;
	uint32_t bits_per_pixel;
	uint32_t width;
	uint32_t height;
	size_t pitch;

	int32_t view_width;
	int32_t view_height;
};

static void prepare_asset(JUN_Video *this, uint8_t id, const char *path, bool menu)
{
	struct jun_video_asset *asset = &this->assets[id];

	asset->image = IMG_Load(path);
	asset->menu = menu;

	SDL_SetHint(SDL_HINT_RENDER_SCALE_QUALITY, "linear");
	asset->texture = SDL_CreateTextureFromSurface(this->renderer, asset->image);
}

JUN_Video *JUN_VideoCreate(JUN_State *state, JUN_Input *input)
{
	JUN_Video *this = calloc(1, sizeof(JUN_Video));

	this->state = state;
	this->input = input;

	SDL_InitSubSystem(SDL_INIT_VIDEO);

	SDL_Rect size = {0};
	SDL_GetDisplayUsableBounds(0, &size);

	SDL_CreateWindowAndRenderer(size.w, size.h, SDL_WINDOW_OPENGL, &this->window, &this->renderer);

	PREPARE(JUN_MENU_TOGGLE_AUDIO,   "menu", "toggle_audio");
	PREPARE(JUN_MENU_TOGGLE_GAMEPAD, "menu", "toggle_gamepad");
	PREPARE(JUN_MENU_SAVE_STATE,     "menu", "save_state");
	PREPARE(JUN_MENU_RESTORE_STATE,  "menu", "restore_state");
	PREPARE(JUN_MENU_FAST_FORWARD,   "menu", "fast_forward");
	PREPARE(JUN_MENU_EXIT,           "menu", "exit");

	PREPARE(RETRO_DEVICE_ID_JOYPAD_UP,    "gamepad", "up");
	PREPARE(RETRO_DEVICE_ID_JOYPAD_DOWN,  "gamepad", "down");
	PREPARE(RETRO_DEVICE_ID_JOYPAD_LEFT,  "gamepad", "left");
	PREPARE(RETRO_DEVICE_ID_JOYPAD_RIGHT, "gamepad", "right");
	PREPARE(RETRO_DEVICE_ID_JOYPAD_L,     "gamepad", "l");

	PREPARE(RETRO_DEVICE_ID_JOYPAD_X, "gamepad", "x");
	PREPARE(RETRO_DEVICE_ID_JOYPAD_B, "gamepad", "b");
	PREPARE(RETRO_DEVICE_ID_JOYPAD_A, "gamepad", "a");
	PREPARE(RETRO_DEVICE_ID_JOYPAD_Y, "gamepad", "y");
	PREPARE(RETRO_DEVICE_ID_JOYPAD_R, "gamepad", "r");

	PREPARE(RETRO_DEVICE_ID_JOYPAD_START,  "gamepad", "start");
	PREPARE(RETRO_DEVICE_ID_JOYPAD_SELECT, "gamepad", "select");

	return this;
}

static void draw_input(JUN_Video *this, uint8_t id, struct jun_draw_desc *desc)
{
	struct jun_video_asset *asset = &this->assets[id];

	double aspect_ratio = (double) asset->image->w / (double) asset->image->h;

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

	double width = desc->radius * 2.0;
	double height = width / aspect_ratio;
	double x = reference_x + desc->margin_x;
	double y = reference_y + desc->margin_y;

	asset->layout.x = x - width / 2.0;
	asset->layout.y = y - height / 2.0;
	asset->layout.w = width;
	asset->layout.h = height;

	JUN_InputMapTouch(this->input, id, x, y, desc->radius * 1.5);
}

static void update_ui_context(JUN_Video *this)
{
	JUN_InputSetCallback(this->input, JUN_MENU_TOGGLE_AUDIO,   JUN_StateToggleAudio);
	JUN_InputSetCallback(this->input, JUN_MENU_TOGGLE_GAMEPAD, JUN_StateToggleGamepad);
	JUN_InputSetCallback(this->input, JUN_MENU_SAVE_STATE,     JUN_StateToggleSaveState);
	JUN_InputSetCallback(this->input, JUN_MENU_RESTORE_STATE,  JUN_StateToggleRestoreState);
	JUN_InputSetCallback(this->input, JUN_MENU_FAST_FORWARD,   JUN_StateToggleFastForward);
	JUN_InputSetCallback(this->input, JUN_MENU_EXIT,           JUN_StateToggleExit);

	DRAW(JUN_MENU_TOGGLE_AUDIO,   CENTER(-150), TOP(25), RADIUS(20));
	DRAW(JUN_MENU_TOGGLE_GAMEPAD, CENTER(-90),  TOP(25), RADIUS(20));
	DRAW(JUN_MENU_SAVE_STATE,     CENTER(-30),  TOP(25), RADIUS(20));
	DRAW(JUN_MENU_RESTORE_STATE,  CENTER(30),   TOP(25), RADIUS(20));
	DRAW(JUN_MENU_FAST_FORWARD,   CENTER(90),   TOP(25), RADIUS(20));
	DRAW(JUN_MENU_EXIT,           CENTER(150),  TOP(25), RADIUS(20));

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

void JUN_VideoClear(JUN_Video *this)
{
	SDL_SetRenderDrawColor(this->renderer, 0, 0, 0, 0);
	SDL_RenderClear(this->renderer);
}

void JUN_VideoUpdateContext(JUN_Video *this, enum retro_pixel_format format, unsigned width, unsigned height, size_t pitch)
{
	switch (format) {
		case RETRO_PIXEL_FORMAT_0RGB1555:
			this->pixel_format = SDL_PIXELFORMAT_ARGB1555;
			this->bits_per_pixel = sizeof(uint16_t);
			break;
		case RETRO_PIXEL_FORMAT_XRGB8888:
			this->pixel_format = SDL_PIXELFORMAT_XRGB8888;
			this->bits_per_pixel = sizeof(uint32_t);
			break;
		case RETRO_PIXEL_FORMAT_RGB565:
			this->pixel_format = SDL_PIXELFORMAT_RGB565;
			this->bits_per_pixel = sizeof(uint16_t);
			break;
		default:
			break;
	}

	if (this->width != width || this->height != height || this->pitch != pitch) {
		SDL_LogInfo(0, "%u x %u (%zu)", width, height, pitch);

		if (this->texture)
			SDL_DestroyTexture(this->texture);

		this->width = width;
		this->height = height;
		this->pitch = pitch ? pitch : width * this->bits_per_pixel;

		SDL_SetHint(SDL_HINT_RENDER_SCALE_QUALITY, "nearest");
		this->texture = SDL_CreateTexture(this->renderer, this->pixel_format, SDL_TEXTUREACCESS_STREAMING, width, height);

		JUN_StateSetFrameMetrics(this->state, this->width, this->height);
	}

	SDL_Rect size = {0};
	SDL_GetDisplayUsableBounds(0, &size);

	if (this->view_width != size.w || this->view_height != size.h) {
		this->view_width = size.w;
		this->view_height = size.h;

		SDL_SetWindowSize(this->window, size.w, size.h);
		JUN_StateSetWindowMetrics(this->state, size.w, size.h);

		update_ui_context(this);
	}
}

void JUN_VideoDrawFrame(JUN_Video *this, const void *data)
{
	// Height offset giving some space to the menu
	uint32_t offset = 50;

	// Position the frame on top of the screen based on the ratios
	float aspect_ratio = (float) this->width / (float) this->height;
	float scale_w = (float) this->view_width / (float) this->width;
	float scale_h = (float) (this->view_height - offset) / (float) this->height;

	// Update the texture and render it
	SDL_Rect rect = {
		.x = scale_w < scale_h ? 0 : (this->view_width - this->width * scale_h) / 2,
		.y = offset,
		.w = scale_w < scale_h ? this->view_width : this->width * scale_h,
		.h = scale_w < scale_h ? this->view_width / aspect_ratio : this->view_height - offset,
	};
	SDL_UpdateTexture(this->texture, NULL, data, this->pitch);
	SDL_RenderCopy(this->renderer, this->texture, NULL, &rect);
}

void JUN_VideoDrawUI(JUN_Video *this)
{
	bool gamepad = JUN_StateHasGamepad(this->state);

	int64_t key = 0;
	uint64_t iter = 0;

	for (size_t i = 0; i < JUN_MENU_MAX; i++) {
		struct jun_video_asset *asset = &this->assets[i];

		if (!gamepad && !asset->menu)
			continue;

		SDL_RenderCopy(this->renderer, asset->texture, NULL, &asset->layout);
	}
}

void JUN_VideoPresent(JUN_Video *this)
{
	SDL_RenderPresent(this->renderer);
}

void JUN_VideoDestroy(JUN_Video **video)
{
	if (!video || !*video)
		return;

	JUN_Video *this = *video;

	if (this->texture)
		SDL_DestroyTexture(this->texture);

	for (size_t i = 0; i < JUN_MENU_MAX; i++) {
		struct jun_video_asset *asset = &this->assets[i];

		SDL_DestroyTexture(asset->texture);
		SDL_FreeSurface(asset->image);
	}

	SDL_DestroyRenderer(this->renderer);
	SDL_DestroyWindow(this->window);
	SDL_QuitSubSystem(SDL_INIT_VIDEO);

	free(this);
	*video = NULL;
}
