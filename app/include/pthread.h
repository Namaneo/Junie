#pragma once

#include_next <pthread.h>

#define SCHED_RR 0

struct sched_param { int sched_priority; };

static int pthread_attr_setschedparam(pthread_attr_t *attr, const struct sched_param *param) { return -1; }
