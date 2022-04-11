#include "matoya.h"

#include "rml/system.h"

double JUN_FrontSystemInterface::GetElapsedTime()
{
    return MTY_GetTime() / 1000.0 / 1000.0 / 10.0;
}
