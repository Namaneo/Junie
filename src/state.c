#include <stdlib.h>

#include "matoya.h"

#include "state.h"

JUN_State *JUN_StateInitialize()
{
    JUN_State *this = MTY_Alloc(1, sizeof(JUN_State));

    this->has_gamepad = true;

    return this;
}

void JUN_StateDestroy(JUN_State **this)
{
    MTY_Free(*this);
    *this = NULL;
}
