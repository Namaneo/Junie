#pragma once

#define RMLUI_NO_THIRDPARTY_CONTAINERS
#define RMLUI_USE_CUSTOM_RTTI
#include "RmlUi/Core.h"

using namespace Rml;

class JunieSystemInterface : public SystemInterface
{
public:
	double GetElapsedTime() override;
};
