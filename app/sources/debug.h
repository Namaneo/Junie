#pragma once

#ifdef DEBUG
void JUN_SetLogFunc();
#else
#define JUN_SetLogFunc()
#endif
