#include <stdlib.h>

#include "matoya.h"

#include "state.h"

struct JUN_State
{
	bool has_gamepad;
	bool has_audio;
	bool should_save_state;
	bool should_restore_state;
	uint8_t fast_forward;

	float frame_width;
	float frame_height;
	float view_width;
	float view_height;

	bool exit;

	JUN_TextureData textures[TEXTURE_MAX];
};

JUN_State *JUN_StateCreate()
{
	JUN_State *this = MTY_Alloc(1, sizeof(JUN_State));

	this->has_gamepad = true;

	return this;
}

bool JUN_StateHasGamepad(JUN_State *this)
{
	return this->has_gamepad;
}

void JUN_StateToggleGamepad(JUN_State *this)
{
	this->has_gamepad = !this->has_gamepad;
}

bool JUN_StateHasAudio(JUN_State *this)
{
	return this->has_audio;
}

void JUN_StateToggleAudio(JUN_State *this)
{
	this->has_audio = !this->has_audio;
}

bool JUN_StateShouldSaveState(JUN_State *this)
{
	return this->should_save_state;
}

void JUN_StateToggleSaveState(JUN_State *this)
{
	this->should_save_state = !this->should_save_state;
}

bool JUN_StateShouldRestoreState(JUN_State *this)
{
	return this->should_restore_state;
}

void JUN_StateToggleRestoreState(JUN_State *this)
{
	this->should_restore_state = !this->should_restore_state;
}

uint8_t JUN_StateGetFastForward(JUN_State *this)
{
	return this->fast_forward;
}

void JUN_StateToggleFastForward(JUN_State *this)
{
	this->fast_forward = (this->fast_forward + 1) % 4;
}

void JUN_StateGetFrameMetrics(JUN_State *this, float *width, float *height)
{
	*width = this->frame_width;
	*height = this->frame_height;
}

void JUN_StateSetFrameMetrics(JUN_State *this, float width, float height)
{
	this->frame_width = width;
	this->frame_height = height;
}

void JUN_StateGetWindowMetrics(JUN_State *this, float *width, float *height)
{
	*width = this->view_width;
	*height = this->view_height;
}

void JUN_StateSetWindowMetrics(JUN_State *this, float width, float height)
{
	this->view_width = width;
	this->view_height = height;
}

JUN_TextureData *JUN_StateGetMetrics(JUN_State *this, uint8_t id)
{
	return &this->textures[id];
}

void JUN_StateSetMetrics(JUN_State *this, JUN_TextureData *texture)
{
	this->textures[texture->id] = *texture;
}

void JUN_StateToggleExit(JUN_State *this)
{
	this->exit = !this->exit;
}

bool JUN_StateShouldExit(JUN_State *this)
{
	return this->exit;
}

void JUN_StateDestroy(JUN_State **this)
{
	MTY_Free(*this);
	*this = NULL;
}
