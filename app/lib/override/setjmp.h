#pragma once

#define jmp_buf int
#define setjmp(jmp) 0
#define longjmp(jmp, x)