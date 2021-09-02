#include "wasi.h"

void *__cxa_allocate_exception(size_t thrown_size)
{
    abort();
}

void __cxa_throw(void *thrown_object, void *tinfo, void (*dest)(void *))
{
    abort();
}
