#pragma once

#define RMLUI_STATIC_LIB
#define RMLUI_NO_THIRDPARTY_CONTAINERS
#define RMLUI_USE_CUSTOM_RTTI
#include "RmlUi/Core.h"

using namespace Rml;

class JUN_FrontEventListener : public EventListener
{
public:
    void ProcessEvent(Event& event) override;
};
