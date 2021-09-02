#pragma once

#include <stdlib.h>

//Here are all the functions that the wasi-sdk does not support yet.
//See for prototypes: https://github.com/llvm-mirror/libcxxabi/blob/master/src/cxa_exception.cpp

void *__cxa_allocate_exception(size_t thrown_size);
void __cxa_throw(void *thrown_object, void *tinfo, void (*dest)(void *));
