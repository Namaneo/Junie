#pragma once

#include <stdint.h>

typedef struct JUN_Buffer JUN_Buffer;

JUN_Buffer *JUN_BufferCreate(uint32_t length);
void JUN_BufferWrite(JUN_Buffer *this, const void *data, int32_t length);
void JUN_BufferRead(JUN_Buffer *this, void *data, int32_t length);
void JUN_BufferDestroy(JUN_Buffer **buffer);
