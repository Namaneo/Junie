#pragma once

// Simulate setjmp.h until WASI supports it
typedef unsigned jmp_buf;

#define setjmp(env) 0
#define longjmp(env, val)