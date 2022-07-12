#include "framerate.h"

#include "matoya.h"

static struct {
    MTY_Time before_run;
    MTY_Time after_run;
    float remaining;
} CTX;

uint32_t JUN_FramerateGetFactor()
{
    MTY_Time before_run = MTY_GetTime();

    float total_loop = MTY_TimeDiff(CTX.before_run, before_run);
    float time_run = MTY_TimeDiff(CTX.before_run, CTX.after_run);
    float time_idle = MTY_TimeDiff(CTX.after_run, before_run);

    CTX.before_run = before_run;

    bool throttling = time_run > time_idle;
	float framerate = 1000.0 / total_loop;

	CTX.remaining += 60.0f / framerate;
	uint32_t pending = (uint32_t) CTX.remaining;
	CTX.remaining -= (float) pending;

	return pending <= 20 && !throttling ? pending : 1;
}

void JUN_FramerateHasRun()
{
    CTX.after_run = MTY_GetTime();
}
