#include "framerate.h"

#include "matoya.h"

static struct {
    MTY_Time before_run;
    MTY_Time after_run;
    float last_diff;
    float remaining;
    bool throttling;
} CTX;

uint32_t JUN_FramerateGetFactor()
{
    CTX.before_run = MTY_GetTime();
    CTX.last_diff = MTY_TimeDiff(CTX.after_run, CTX.before_run);

	float framerate = 1000.0 / CTX.last_diff;

	CTX.remaining += 60.0f / framerate;
	uint32_t pending = (uint32_t) CTX.remaining;
	CTX.remaining -= (float) pending;

	return pending <= 20 && !CTX.throttling ? pending : 1;
}

void JUN_FramerateHasRunned()
{
    CTX.after_run = MTY_GetTime();
	CTX.throttling = MTY_TimeDiff(CTX.before_run, CTX.after_run) > CTX.last_diff;
}
