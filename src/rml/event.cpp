#include <cstdlib>

#include "rml/event.h"

void JUN_FrontEventListener::ProcessEvent(Event& event)
{
    const std::string current_tag  = event.GetTargetElement()->GetTagName();
    const std::string parent_class = event.GetTargetElement()->GetParentNode()->GetClassNames();
    if (current_tag != "div" || parent_class != "container")
        return;
    
    char color[19] = {0};
    snprintf(color, 19, "rgb(%d, %d, %d)", rand() % 0xFF, rand() % 0xFF, rand() % 0xFF);
    event.GetTargetElement()->SetProperty("background-color", color);
}
