#pragma once

#ifdef DEBUG
void JUN_SetLogFunc();
void JUN_PrintEvent(const MTY_Event *evt);
#else
#define JUN_SetLogFunc()
#define JUN_PrintEvent(evt)
#endif
