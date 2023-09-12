#pragma once

#include "junie.h"

void JunieInteropInit(JunieSymbols *sym);
void JunieInteropVideo(const JunieVideo *video);
void JunieInteropAudio(const JunieAudio *audio);
void JunieInteropVariables(const JunieVariable *variables);
