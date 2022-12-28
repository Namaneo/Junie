#include <math.h>
#include <SDL2/SDL.h>

#include "libretro.h"

#include "state.h"
#include "filesystem.h"

#include "input.h"

#define MIN_RETRO_INPUTS 0
#define MAX_RETRO_INPUTS 15

#define MIN_MENU_INPUTS (0 | JUN_MENU_MASK)
#define MAX_MENU_INPUTS (5 | JUN_MENU_MASK)

#define MAX_INPUTS   UINT8_MAX
#define MAX_POINTERS 4

struct jun_input_pointer {
    int32_t id;
	bool pressed;
	double x;
	double y;
};

struct jun_input_status {
	bool pressed;

    double x;
    double y;
	double radius;

    struct jun_input_pointer *locked_by; // TODO remove that
    JUN_StateCallback callback;
};

struct JUN_Input {
    JUN_State *state;

    struct jun_input_status inputs[MAX_INPUTS];
    struct jun_input_pointer pointers[MAX_POINTERS];
};

JUN_Input *JUN_InputCreate(JUN_State *state)
{
    JUN_Input *ctx = calloc(1, sizeof(JUN_Input));

    float view_width = 0, view_height = 0;
	JUN_StateGetWindowMetrics(state, &view_width, &view_height);

    ctx->state = state;

    return ctx;
}

void JUN_InputDestroy(JUN_Input **input)
{
    if (!input || !*input)
		return;

	JUN_Input *ctx = *input;

	free(ctx);
	*input = NULL;
}

void JUN_InputMapTouch(JUN_Input *ctx, uint8_t id, double x, double y, double radius)
{
    struct jun_input_status *input = &ctx->inputs[id];

    input->x = x;
    input->y = y;
    input->radius = radius;
}

void JUN_InputSetCallback(JUN_Input *ctx, uint8_t id, JUN_StateCallback callback)
{
    struct jun_input_status *input = &ctx->inputs[id];

	input->callback = callback;
}

static void set_mouse(JUN_Input *ctx, struct jun_input_pointer *pointer, uint8_t min, uint8_t max)
{
	for (size_t i = min; i <= max; ++i) {
		struct jun_input_status *input = &ctx->inputs[i];

		float distance_x = powf(pointer->x - input->x, 2);
		float distance_y = powf(pointer->y - input->y, 2);

		bool inside_circle = distance_x + distance_y < powf(input->radius, 2);

		if (input->locked_by == pointer)
			input->pressed = false;

		if (inside_circle) {
			input->pressed = pointer->pressed;
			input->locked_by = pointer;
		}

		if (input->pressed && input->callback)
			input->callback(ctx->state);
	}
}

static void set_touch(JUN_Input *ctx, struct jun_input_pointer *pointer)
{
	float view_width = 0, view_height = 0, frame_width = 0, frame_height = 0;
	JUN_StateGetWindowMetrics(ctx->state, &view_width, &view_height);
	JUN_StateGetFrameMetrics(ctx->state, &frame_width, &frame_height);

	float aspect_ratio = frame_width / frame_height;

	float width = view_width;
	float height = width / aspect_ratio;
	float correction_x = 0;
	float correction_y = 0;

	if (height > view_height) {
		height = view_height;
		width = height * aspect_ratio;
		correction_x = (view_width - width) / 2.0f;
	}

	if (width == view_width) {
		correction_y = view_width * 0.1f;
	}

	pointer->x = pointer->x - correction_x;
	pointer->y = pointer->y - correction_y;

	if (pointer->x < 0 || pointer->x > width || pointer->y < 0 || pointer->y > height)
		return;

	pointer->x = (pointer->x / width) * frame_width;
	pointer->y = (pointer->y / height) * frame_height;

	pointer->x = ((pointer->x * 0x10000) / frame_width) - 0x8000;
	pointer->y = ((pointer->y * 0x10000) / frame_height) - 0x8000;
}

static struct jun_input_pointer *get_pointer(JUN_Input *ctx, int32_t id)
{
	for (size_t i = 0; i < MAX_POINTERS; ++i) {
		if (ctx->pointers[i].id == id)
			return &ctx->pointers[i];
	}

	for (size_t i = 0; i < MAX_POINTERS; ++i) {
		if (!ctx->pointers[i].pressed) {
			ctx->pointers[i].id = id;
			return &ctx->pointers[i];
		}
	}

	return NULL;
}

static struct jun_input_pointer *window_motion(JUN_Input *ctx, int32_t id, int32_t x, int32_t y)
{
	struct jun_input_pointer *pointer = get_pointer(ctx, id);

	if (!pointer)
		return NULL;

	pointer->x = x;
	pointer->y = y;

	return pointer;
}

static struct jun_input_pointer *window_button(JUN_Input *ctx, int32_t id, bool pressed, int32_t x, int32_t y)
{
	struct jun_input_pointer *pointer = get_pointer(ctx, id);

	if (!pointer)
		return NULL;

	pointer->pressed = pressed;
	pointer->x = x;
	pointer->y = y;

	set_mouse(ctx, pointer, MIN_MENU_INPUTS, MAX_MENU_INPUTS);

	return pointer;
}

void JUN_InputPollEvents(JUN_Input *ctx)
{
	SDL_Event event = {0};

    while (SDL_PollEvent(&event)) {
		struct jun_input_pointer *pointer = NULL;

		switch(event.type) {
			case SDL_MOUSEMOTION: {
				if (event.motion.which == SDL_TOUCH_MOUSEID)
					break;

				pointer = window_motion(ctx, 0, event.motion.x, event.motion.y);
				break;
			}
			case SDL_MOUSEBUTTONDOWN:
			case SDL_MOUSEBUTTONUP: {
				if (event.button.which == SDL_TOUCH_MOUSEID)
					break;

				bool pressed = event.type == SDL_MOUSEBUTTONDOWN;
				pointer = window_button(ctx, 0, pressed, event.button.x, event.button.y);
				break;
			}
			case SDL_FINGERMOTION:
			case SDL_FINGERDOWN:
			case SDL_FINGERUP: {
				float view_width = 0, view_height = 0;
				JUN_StateGetWindowMetrics(ctx->state, &view_width, &view_height);

				uint32_t x = view_width * event.tfinger.x;
				uint32_t y = view_height * event.tfinger.y;

				if (event.type == SDL_FINGERMOTION)
					pointer = window_motion(ctx, event.tfinger.fingerId, x, y);
				if (event.type == SDL_FINGERDOWN)
					pointer = window_button(ctx, event.tfinger.fingerId, true, x, y);
				if (event.type == SDL_FINGERUP)
					pointer = window_button(ctx, event.tfinger.fingerId, false, x, y);
				break;
			}
			default:
				break;
		}

		if (!pointer)
			continue;

		if (JUN_StateHasGamepad(ctx->state)) {
			set_mouse(ctx, pointer, MIN_RETRO_INPUTS, MAX_RETRO_INPUTS);

		} else {
			set_touch(ctx, pointer);
		}
	}
}

int16_t JUN_InputGetStatus(JUN_Input *ctx, uint8_t id, uint8_t device)
{
	if (device == RETRO_DEVICE_JOYPAD)
		return ctx->inputs[id].pressed;

	if (device == RETRO_DEVICE_POINTER && !JUN_StateHasGamepad(ctx->state)) {
		switch (id) {
			case RETRO_DEVICE_ID_POINTER_COUNT:
				return 1;
			case RETRO_DEVICE_ID_POINTER_PRESSED:
				return ctx->pointers[0].pressed;
			case RETRO_DEVICE_ID_POINTER_X:
				return ctx->pointers[0].x;
			case RETRO_DEVICE_ID_POINTER_Y:
				return ctx->pointers[0].y;
		}
	}

	return false;
}

void JUN_InputReset(JUN_Input *ctx)
{
	for (size_t i = 0; i < MAX_INPUTS; ++i)
		ctx->inputs[i].pressed = false;
	for (size_t i = 0; i < MAX_POINTERS; ++i)
		ctx->pointers[i].pressed = false;
}
