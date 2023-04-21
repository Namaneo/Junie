#include <stdlib.h>
#include <pthread.h>
#include <time.h>

int pthread_attr_setschedpolicy(pthread_attr_t *attr, int policy)
{
	return 1;
}

int pthread_attr_getschedpolicy(const pthread_attr_t *restrict attr, int *restrict policy)
{
	return 1;
}

clock_t clock(void)
{
	return 0;
}

void *__cxa_allocate_exception(size_t thrown_size)
{
	abort();
}

void __cxa_throw(void *thrown_object, void *tinfo, void (*dest)(void *))
{
	abort();
}
