#include "matoya.h"

#include "alloc.h"

void *__real_MTY_Alloc(size_t len, size_t size);
void *__real_MTY_Realloc(void *mem, size_t len, size_t size);
void __real_MTY_Free(void *mem);

void *__real_malloc(size_t __size);
void *__real_calloc(size_t __nmemb, size_t __size);
void *__real_realloc(void *__ptr, size_t __size);
void __real_free(void *__ptr);

bool entered_pointers = false;
size_t total_size = 0;
size_t pointer_count = 0;
MTY_Hash *pointers = NULL;

void JUN_PrintMemory() 
{
    MTY_Log("pointers: %zu, size: %zu", pointer_count, total_size);
}

static void ensure_initialized()
{
    if (pointers || entered_pointers)
        return;

    entered_pointers = true;
    pointers = MTY_HashCreate(0);
    entered_pointers = false;
}

void *__wrap_MTY_Alloc(size_t len, size_t size)
{
    entered_pointers = true;
    return __real_MTY_Alloc(len, size);
    entered_pointers = false;
}

void *__wrap_MTY_Realloc(void *mem, size_t len, size_t size)
{
    entered_pointers = true;
    return __real_MTY_Realloc(mem, len, size);
    entered_pointers = false;
}

void __wrap_MTY_Free(void *mem)
{
    entered_pointers = true;
    __real_MTY_Free(mem);
    entered_pointers = false;
}

void *__wrap_malloc(size_t __size)
{
    ensure_initialized();

	void *ptr = __real_malloc(__size);

	if (!entered_pointers) {
		entered_pointers = true;
		total_size += __size;
        pointer_count++;
		MTY_HashSetInt(pointers, (int64_t) ptr, (void *) __size);
		entered_pointers = false;
	}

	return ptr;
}

void *__wrap_calloc(size_t __nmemb, size_t __size)
{
    ensure_initialized();

	void *ptr = __real_calloc(__nmemb, __size);

	if (!entered_pointers) {
		entered_pointers = true;
		total_size += __nmemb * __size;
        pointer_count++;
		MTY_HashSetInt(pointers, (int64_t) ptr, (void *) (__nmemb * __size));
		entered_pointers = false;
	}

	return ptr;
}

void *__wrap_realloc(void *__ptr, size_t __size)
{
    ensure_initialized();

	void *ptr = __real_realloc(__ptr, __size);

	if (!entered_pointers) {
		entered_pointers = true;
		size_t prev = (size_t) MTY_HashGetInt(pointers, (int64_t) __ptr);
		total_size += __size - prev;
		MTY_HashSetInt(pointers, (int64_t) __ptr, NULL);
		MTY_HashSetInt(pointers, (int64_t) ptr, (void *) __size);
		entered_pointers = false;
	}

	return ptr;
}

void __wrap_free(void *__ptr)
{
    ensure_initialized();

	__real_free(__ptr);

	if (!entered_pointers) {
		entered_pointers = true;
		size_t prev = (size_t) MTY_HashGetInt(pointers, (int64_t) __ptr);
        if (prev) {
            total_size -= prev;
            pointer_count--;
            MTY_HashSetInt(pointers, (int64_t) __ptr, NULL);
        }
		entered_pointers = false;
	}
}
