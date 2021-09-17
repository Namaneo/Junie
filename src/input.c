#include <math.h>

#include "libretro.h"

#include "enums.h"

#include "input.h"

#define INPUT_LEFT_TOTAL    6
#define INPUT_RIGHT_TOTAL   6
#define INPUT_TOTAL         INPUT_LEFT_TOTAL + INPUT_RIGHT_TOTAL

#define MAX_POINTERS         4

typedef struct JUN_InputPointer  JUN_InputPointer;
typedef struct JUN_InputStatus   JUN_InputStatus;
typedef struct JUN_InputTexture  JUN_InputTexture;
typedef struct JUN_InputInstance JUN_InputInstance;

struct JUN_InputPointer
{
   int32_t id;
   bool pressed;
   float x;
   float y;
};

struct JUN_InputStatus
{
    unsigned key;
    MTY_Point center;
    float radius;
    bool pressed;
    JUN_InputPointer *locked_by;
    JUN_StateCallback callback;
};

struct JUN_InputInstance
{
   JUN_TextureData texture;

   size_t inputs_size;
   JUN_InputStatus **inputs;
};

struct JUN_Input
{
    JUN_State *state;

    float frame_width;
    float frame_height;
    float view_width;
    float view_height;
 
    JUN_InputInstance instances[CONTROLLER_MAX];
 
    JUN_InputStatus menus[MENU_MAX];
    JUN_InputStatus inputs[INPUT_TOTAL];
 
    JUN_InputPointer pointers[MAX_POINTERS];
};

static void toggle_audio(JUN_State *state)         { state->has_audio            = !state->has_audio;             }
static void toggle_gamepad(JUN_State *state)       { state->has_gamepad          = !state->has_gamepad;           }
static void should_save_state(JUN_State *state)    { state->should_save_state    = true;                          }
static void should_restore_state(JUN_State *state) { state->should_restore_state = true;                          }
static void fast_forward(JUN_State *state)         { state->fast_forward         = (state->fast_forward + 1) % 4; }

JUN_Input *JUN_InputInitialize(JUN_State *state)
{
    JUN_Input *this = MTY_Alloc(1, sizeof(JUN_Input));

    this->state = state;

    /* Menu controller */

    this->menus[MENU_TOGGLE_AUDIO].center.x = 55;
    this->menus[MENU_TOGGLE_AUDIO].center.y = 60;
    this->menus[MENU_TOGGLE_AUDIO].radius = 80;
    this->menus[MENU_TOGGLE_AUDIO].callback = toggle_audio;

    this->menus[MENU_TOGGLE_GAMEPAD].center.x = 210;
    this->menus[MENU_TOGGLE_GAMEPAD].center.y = 60;
    this->menus[MENU_TOGGLE_GAMEPAD].radius = 80;
    this->menus[MENU_TOGGLE_GAMEPAD].callback = toggle_gamepad;

    this->menus[MENU_SAVE_STATE].center.x = 400;
    this->menus[MENU_SAVE_STATE].center.y = 60;
    this->menus[MENU_SAVE_STATE].radius = 80;
    this->menus[MENU_SAVE_STATE].callback = should_save_state;

    this->menus[MENU_RESTORE_STATE].center.x = 510;
    this->menus[MENU_RESTORE_STATE].center.y = 60;
    this->menus[MENU_RESTORE_STATE].radius = 80;
    this->menus[MENU_RESTORE_STATE].callback = should_restore_state;

    this->menus[MENU_FAST_FORWARD].center.x = 665;
    this->menus[MENU_FAST_FORWARD].center.y = 60;
    this->menus[MENU_FAST_FORWARD].radius = 80;
    this->menus[MENU_FAST_FORWARD].callback = fast_forward;

    JUN_InputStatus *menu_inputs[MENU_MAX] =
    {
        &this->menus[MENU_TOGGLE_AUDIO],
        &this->menus[MENU_TOGGLE_GAMEPAD],
        &this->menus[MENU_SAVE_STATE],
        &this->menus[MENU_RESTORE_STATE],
        &this->menus[MENU_FAST_FORWARD],
    };

    this->instances[CONTROLLER_MENU].inputs_size = MENU_MAX;
    this->instances[CONTROLLER_MENU].inputs = MTY_Dup(menu_inputs, sizeof menu_inputs);

    /* Left controller */

    this->inputs[RETRO_DEVICE_ID_JOYPAD_UP].center.x = 290;
    this->inputs[RETRO_DEVICE_ID_JOYPAD_UP].center.y = 310;
    this->inputs[RETRO_DEVICE_ID_JOYPAD_UP].radius = 120;

    this->inputs[RETRO_DEVICE_ID_JOYPAD_DOWN].center.x = 290;
    this->inputs[RETRO_DEVICE_ID_JOYPAD_DOWN].center.y = 660;
    this->inputs[RETRO_DEVICE_ID_JOYPAD_DOWN].radius = 120;

    this->inputs[RETRO_DEVICE_ID_JOYPAD_LEFT].center.x = 120;
    this->inputs[RETRO_DEVICE_ID_JOYPAD_LEFT].center.y = 490;
    this->inputs[RETRO_DEVICE_ID_JOYPAD_LEFT].radius = 120;

    this->inputs[RETRO_DEVICE_ID_JOYPAD_RIGHT].center.x = 470;
    this->inputs[RETRO_DEVICE_ID_JOYPAD_RIGHT].center.y = 490;
    this->inputs[RETRO_DEVICE_ID_JOYPAD_RIGHT].radius = 120;

    this->inputs[RETRO_DEVICE_ID_JOYPAD_L].center.x = 150;
    this->inputs[RETRO_DEVICE_ID_JOYPAD_L].center.y = 60;
    this->inputs[RETRO_DEVICE_ID_JOYPAD_L].radius = 120;

    this->inputs[RETRO_DEVICE_ID_JOYPAD_SELECT].center.x = 540;
    this->inputs[RETRO_DEVICE_ID_JOYPAD_SELECT].center.y = 870;
    this->inputs[RETRO_DEVICE_ID_JOYPAD_SELECT].radius = 80;

    JUN_InputStatus *left_inputs[INPUT_LEFT_TOTAL] =
    {
        &this->inputs[RETRO_DEVICE_ID_JOYPAD_UP],
        &this->inputs[RETRO_DEVICE_ID_JOYPAD_DOWN],
        &this->inputs[RETRO_DEVICE_ID_JOYPAD_LEFT],
        &this->inputs[RETRO_DEVICE_ID_JOYPAD_RIGHT],
        &this->inputs[RETRO_DEVICE_ID_JOYPAD_L],
        &this->inputs[RETRO_DEVICE_ID_JOYPAD_SELECT],
    };

    this->instances[CONTROLLER_LEFT].inputs_size = INPUT_LEFT_TOTAL;
    this->instances[CONTROLLER_LEFT].inputs = MTY_Dup(left_inputs, sizeof left_inputs);

    /* Right controller */

    this->inputs[RETRO_DEVICE_ID_JOYPAD_A].center.x = 490;
    this->inputs[RETRO_DEVICE_ID_JOYPAD_A].center.y = 490;
    this->inputs[RETRO_DEVICE_ID_JOYPAD_A].radius = 120;

    this->inputs[RETRO_DEVICE_ID_JOYPAD_B].center.x = 310;
    this->inputs[RETRO_DEVICE_ID_JOYPAD_B].center.y = 670;
    this->inputs[RETRO_DEVICE_ID_JOYPAD_B].radius = 120;

    this->inputs[RETRO_DEVICE_ID_JOYPAD_X].center.x = 310;
    this->inputs[RETRO_DEVICE_ID_JOYPAD_X].center.y = 300;
    this->inputs[RETRO_DEVICE_ID_JOYPAD_X].radius = 120;

    this->inputs[RETRO_DEVICE_ID_JOYPAD_Y].center.x = 130;
    this->inputs[RETRO_DEVICE_ID_JOYPAD_Y].center.y = 490;
    this->inputs[RETRO_DEVICE_ID_JOYPAD_Y].radius = 120;

    this->inputs[RETRO_DEVICE_ID_JOYPAD_R].center.x = 470;
    this->inputs[RETRO_DEVICE_ID_JOYPAD_R].center.y = 60;
    this->inputs[RETRO_DEVICE_ID_JOYPAD_R].radius = 120;

    this->inputs[RETRO_DEVICE_ID_JOYPAD_START].center.x = 100;
    this->inputs[RETRO_DEVICE_ID_JOYPAD_START].center.y = 870;
    this->inputs[RETRO_DEVICE_ID_JOYPAD_START].radius = 80;

    JUN_InputStatus *right_inputs[INPUT_RIGHT_TOTAL] =
    {
        &this->inputs[RETRO_DEVICE_ID_JOYPAD_A],
        &this->inputs[RETRO_DEVICE_ID_JOYPAD_B],
        &this->inputs[RETRO_DEVICE_ID_JOYPAD_X],
        &this->inputs[RETRO_DEVICE_ID_JOYPAD_Y],
        &this->inputs[RETRO_DEVICE_ID_JOYPAD_R],
        &this->inputs[RETRO_DEVICE_ID_JOYPAD_START],
    };

    this->instances[CONTROLLER_RIGHT].inputs_size = INPUT_RIGHT_TOTAL;
    this->instances[CONTROLLER_RIGHT].inputs = MTY_Dup(right_inputs, sizeof right_inputs);

    return this;
}

void JUN_InputSetBinding(JUN_Input *this, const char *joypad, char *keyboard)
{
    char *joypad_key   = MTY_SprintfD("RETRO_DEVICE_ID_JOYPAD_%s", joypad);
    char *keyboard_key = MTY_SprintfD("MTY_KEY_%s", keyboard);

    uint32_t joypad_value   = JUN_EnumsGetInt(JUN_ENUM_JOYPAD, joypad_key);
    uint32_t keyboard_value = JUN_EnumsGetInt(JUN_ENUM_KEYBOARD, keyboard_key);

    this->inputs[joypad_value].key = keyboard_value;

    MTY_Free(joypad_key);
    MTY_Free(keyboard_key);
}

void JUN_InputSetFrameMetrics(JUN_Input *this, float width, float height)
{
    this->frame_width  = width;
    this->frame_height = height;
}

void JUN_InputSetWindowMetrics(JUN_Input *this, float width, float height)
{
    this->view_width  = width;
    this->view_height = height;
}

void JUN_InputSetMetrics(JUN_Input *this, JUN_TextureData *texture)
{
    this->instances[texture->id].texture = *texture;
}

JUN_TextureData *JUN_InputGetMetrics(JUN_Input *this, JUN_TextureType type)
{
    return &this->instances[type].texture;
}

static void set_key(JUN_Input *this, const MTY_Key key, bool pressed)
{
    for (uint8_t i = 0; i < INPUT_TOTAL; ++i)
    {
        if (this->inputs[i].key == key)
        {
            this->inputs[i].pressed = pressed;
            break;
        }
    }
}

static void set_button(JUN_Input *this, JUN_InputInstance *controller, JUN_InputPointer *pointer)
{
    for (size_t i = 0; i < controller->inputs_size; ++i)
    {
        JUN_InputStatus *input = controller->inputs[i];

        float center_x = input->center.x * (controller->texture.width  / controller->texture.image_width);
        float center_y = input->center.y * (controller->texture.height / controller->texture.image_height);
        float radius   = input->radius   * (controller->texture.width  / controller->texture.image_width);

        float distance_x = powf(pointer->x - (center_x + controller->texture.x), 2);
        float distance_y = powf(pointer->y - (center_y + controller->texture.y), 2);

        bool insideCircle = distance_x + distance_y < powf(radius, 2);

        if (insideCircle)
        {
            input->pressed   = pointer->pressed;
            input->locked_by = pointer;
        }
        else if (input->locked_by == pointer)
        {
            input->pressed = false;
        }

        if (input->pressed && input->callback)
            input->callback(this->state);
    }
}

static void set_touch(JUN_Input *this, JUN_InputPointer *pointer)
{
    float aspect_ratio = (float)this->frame_width / (float)this->frame_height;

    float width        = this->view_width;
    float height       = width / aspect_ratio;
    float correction_x = 0;
    float correction_y = 0;

    if (height > this->view_height)
    {
        height     = this->view_height;
        width      = height * aspect_ratio;
        correction_x = (this->view_width - width) / 2.0f;
    }

    if (width == this->view_width)
    {
        correction_y = this->view_width * 0.1f;
    }

    pointer->x = pointer->x - correction_x;
    pointer->y = pointer->y - correction_y;

    if (pointer->x < 0 || pointer->x > width || pointer->y < 0 || pointer->y > height)
        return;

    pointer->x = (pointer->x / width)  * this->frame_width;
    pointer->y = (pointer->y / height) * this->frame_height;

    pointer->x = ((pointer->x * 0x10000) / this->frame_width)  - 0x8000;
    pointer->y = ((pointer->y * 0x10000) / this->frame_height) - 0x8000;
}

static JUN_InputPointer *get_pointer(JUN_Input *this, int32_t id)
{
    for (size_t i = 0; i < MAX_POINTERS; ++i)
    {
        if (this->pointers[i].id == id)
            return &this->pointers[i];
    }

    for (size_t i = 0; i < MAX_POINTERS; ++i)
    {
        if (!this->pointers[i].pressed)
        {
            this->pointers[i].id = id;
            return &this->pointers[i];
        }
    }

    return NULL;
}

void JUN_InputSetStatus(JUN_Input *this, const MTY_Event *event)
{
    if (event->type == MTY_EVENT_KEY) 
    {
        set_key(this, event->key.key, event->key.pressed);
        return;
    }

    JUN_InputPointer *pointer = NULL;

    if (event->type == MTY_EVENT_BUTTON) 
    {
        pointer = get_pointer(this, event->button.id);

        if (!pointer)
            return;

        pointer->pressed = event->button.pressed;
        pointer->x       = event->button.x;
        pointer->y       = event->button.y;

        set_button(this, &this->instances[CONTROLLER_MENU], pointer);
    }

    if (event->type == MTY_EVENT_MOTION)
    {
        pointer = get_pointer(this, event->motion.id);

        if (!pointer)
            return;

        pointer->x = event->motion.x;
        pointer->y = event->motion.y;
    }

    if (!pointer)
        return;

    if (this->state->has_gamepad) 
    {
        set_button(this, &this->instances[CONTROLLER_LEFT],  pointer);
        set_button(this, &this->instances[CONTROLLER_RIGHT], pointer);
    }
    else
    {
        set_touch(this, pointer);
    }    
}

int16_t JUN_InputGetStatus(JUN_Input *this, uint32_t device, uint32_t retro_key)
{
    if (device == RETRO_DEVICE_JOYPAD)
    {
        if (retro_key >= INPUT_TOTAL)
            return false;
            
        return this->inputs[retro_key].pressed;
    }

    if (device == RETRO_DEVICE_POINTER && !this->state->has_gamepad)
    {
        switch (retro_key)
        {
            case RETRO_DEVICE_ID_POINTER_COUNT:
                return 1;
            case RETRO_DEVICE_ID_POINTER_PRESSED:
                return this->pointers[0].pressed;
            case RETRO_DEVICE_ID_POINTER_X:
                return this->pointers[0].x;
            case RETRO_DEVICE_ID_POINTER_Y:
                return this->pointers[0].y;
        }
    }

    return false;
}

void JUN_InputDestroy(JUN_Input **this)
{
    MTY_Free((*this)->instances[CONTROLLER_MENU].inputs);
    MTY_Free((*this)->instances[CONTROLLER_LEFT].inputs);
    MTY_Free((*this)->instances[CONTROLLER_RIGHT].inputs);

    MTY_Free(*this);
    *this = NULL;
}
