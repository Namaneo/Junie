#include "matoya.h"

#include "rml/system.h"

double JunieSystemInterface::GetElapsedTime()
{
    return MTY_GetTime() / 1000 / 1000;
}
