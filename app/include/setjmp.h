#pragma once

typedef int jmp_buf;

static int setjmp(jmp_buf env) { return 0; }
static void longjmp(jmp_buf env, int val) { abort(); }
