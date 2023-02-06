#pragma once

#include <stdint.h>
#include <stdbool.h>

typedef struct JUN_Framerate JUN_Framerate;

JUN_Framerate *JUN_FramerateCreate(double framerate);
uint32_t JUN_FramerateGetFPS(JUN_Framerate *this);
bool JUN_FramerateDelay(JUN_Framerate *this);
void JUN_FramerateDestroy(JUN_Framerate **framerate);
