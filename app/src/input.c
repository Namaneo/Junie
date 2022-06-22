#include <math.h>

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
    JUN_TextureData *texture;

    MTY_Key key;

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
    JUN_Input *ctx = MTY_Alloc(1, sizeof(JUN_Input));

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

	MTY_Free(ctx);
	*input = NULL;
}

void JUN_InputMapTouch(JUN_Input *ctx, uint8_t id, double x, double y, double radius)
{
    struct jun_input_status *input = &ctx->inputs[id];

    input->x = x;
    input->y = y;
    input->radius = radius;
    input->texture = JUN_StateGetMetrics(ctx->state, id);
}

void JUN_InputMapKey(JUN_Input *ctx, uint8_t id, MTY_Key key)
{
    struct jun_input_status *input = &ctx->inputs[id];

    input->key = key;
}

void JUN_InputSetCallback(JUN_Input *ctx, uint8_t id, JUN_StateCallback callback)
{
    struct jun_input_status *input = &ctx->inputs[id];

	input->callback = callback;
}

static void set_key(JUN_Input *ctx, const MTY_Key key, bool pressed)
{
	for (uint8_t i = MIN_MENU_INPUTS; i <= MAX_MENU_INPUTS; ++i) {
		if (ctx->inputs[i].key == key) {
			ctx->inputs[i].pressed = pressed;
			return;
		}
	}

	for (uint8_t i = MIN_RETRO_INPUTS; i <= MAX_RETRO_INPUTS; ++i) {
		if (ctx->inputs[i].key == key) {
			ctx->inputs[i].pressed = pressed;
			return;
		}
	}
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

void JUN_InputSetStatus(JUN_Input *ctx, const MTY_Event *event)
{
	if (event->type == MTY_EVENT_KEY) {
		set_key(ctx, event->key.key, event->key.pressed);
		return;
	}

	struct jun_input_pointer *pointer = NULL;

	if (event->type == MTY_EVENT_BUTTON) {
		pointer = get_pointer(ctx, event->button.id);

		if (!pointer)
			return;

		pointer->pressed = event->button.pressed;
		pointer->x = event->button.x;
		pointer->y = event->button.y;

		set_mouse(ctx, pointer, MIN_MENU_INPUTS, MAX_MENU_INPUTS);
	}

	if (event->type == MTY_EVENT_MOTION) {
		pointer = get_pointer(ctx, event->motion.id);

		if (!pointer)
			return;

		pointer->x = event->motion.x;
		pointer->y = event->motion.y;
	}

	if (!pointer)
		return;

	if (JUN_StateHasGamepad(ctx->state)) {
		set_mouse(ctx, pointer, MIN_RETRO_INPUTS, MAX_RETRO_INPUTS);
	
	} else {
		set_touch(ctx, pointer);
	}
}

int16_t JUN_InputGetStatus(JUN_Input *ctx, uint8_t id, uint8_t device)
{
	if (device == RETRO_DEVICE_JOYPAD) {
		return ctx->inputs[id].pressed;
	}

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
