#include <stdio.h>
#include <string.h>

#include "matoya.h"
#include "interop.h"
#include "debug.h"

#define TOP_ENTRIES 20

static struct {
	bool is_local;
	bool entered_pointers;
	MTY_Hash *pointers;
} CTX;

struct memory_entry {
	void *pointer;
	size_t size;
	bool local;
};

void JUN_MemoryDump()
{
    CTX.entered_pointers = true;

	size_t total_size = 0;
	size_t pointer_count = 0;
	struct memory_entry top[TOP_ENTRIES] = {0};

	uint64_t iter = 0;
	int64_t key = 0;
	while (MTY_HashGetNextKeyInt(CTX.pointers, &iter, &key)) {
		struct memory_entry *entry = MTY_HashGetInt(CTX.pointers, key);
		total_size += entry->size;
		pointer_count++;

		struct memory_entry current = *entry;
		for (size_t i = 0; i < TOP_ENTRIES; i++) {
			if (top[i].size > current.size)
				continue;

			struct memory_entry tmp = top[i];
			top[i] = current;
			current = tmp;
		}
	}

    MTY_Log("CTX.pointers: %zu, size: %zu", pointer_count, total_size);
	for (size_t i = 0; i < TOP_ENTRIES; i++)
	    MTY_Log("[%02zu] pointer: %p, size: %zu, local: %d", i + 1, top[i].pointer, top[i].size, top[i].local);

    CTX.entered_pointers = false;
}

static void log_func(const char *message, void *opaque)
{
	if (message[strlen(message) - 1] != '\n')
		printf("%s\n", message);
	else
		printf("%s", message);
}

void JUN_SetLogFunc()
{
	MTY_SetLogFunc(log_func, NULL);
}

void JUN_PrintEvent(const MTY_Event *evt)
{
	MTY_PrintEvent(evt);
}

// Wrappers

void *__real_MTY_Alloc(size_t len, size_t size);
void *__real_MTY_Realloc(void *mem, size_t len, size_t size);
void __real_MTY_Free(void *mem);

void *__real_malloc(size_t __size);
void *__real_calloc(size_t __nmemb, size_t __size);
void *__real_realloc(void *__ptr, size_t __size);
void __real_free(void *__ptr);

static void ensure_initialized()
{
    if (CTX.pointers || CTX.entered_pointers)
        return;

    CTX.entered_pointers = true;
    CTX.pointers = MTY_HashCreate(0);
    CTX.entered_pointers = false;
}

void *__wrap_MTY_Alloc(size_t len, size_t size)
{
    CTX.is_local = true;
    void *ptr = __real_MTY_Alloc(len, size);
    CTX.is_local = false;
	return ptr;
}

void *__wrap_MTY_Realloc(void *mem, size_t len, size_t size)
{
    CTX.is_local = true;
    void *ptr = __real_MTY_Realloc(mem, len, size);
    CTX.is_local = false;
	return ptr;
}

void __wrap_MTY_Free(void *mem)
{
    CTX.is_local = true;
    __real_MTY_Free(mem);
    CTX.is_local = false;
}

void *__wrap_malloc(size_t __size)
{
    ensure_initialized();

	void *ptr = __real_malloc(__size);

	if (!CTX.entered_pointers) {
		CTX.entered_pointers = true;

		struct memory_entry *entry = MTY_Alloc(1, sizeof(struct memory_entry));
		entry->pointer = ptr;
		entry->size = __size;
		entry->local = CTX.is_local;

		MTY_HashSetInt(CTX.pointers, (int64_t) entry->pointer, entry);

		CTX.entered_pointers = false;
	}

	return ptr;
}

void *__wrap_calloc(size_t __nmemb, size_t __size)
{
    ensure_initialized();

	void *ptr = __real_calloc(__nmemb, __size);

	if (!CTX.entered_pointers) {
		CTX.entered_pointers = true;

		struct memory_entry *entry = MTY_Alloc(1, sizeof(struct memory_entry));
		entry->pointer = ptr;
		entry->size = __nmemb * __size;
		entry->local = CTX.is_local;

		MTY_HashSetInt(CTX.pointers, (int64_t) entry->pointer, entry);

		CTX.entered_pointers = false;
	}

	return ptr;
}

void *__wrap_realloc(void *__ptr, size_t __size)
{
    ensure_initialized();

	void *ptr = __real_realloc(__ptr, __size);

	if (!CTX.entered_pointers) {
		CTX.entered_pointers = true;

		struct memory_entry *entry = MTY_Alloc(1, sizeof(struct memory_entry));
		entry->pointer = ptr;
		entry->size = __size;
		entry->local = CTX.is_local;

		struct memory_entry *prev_entry = MTY_HashPopInt(CTX.pointers, (int64_t) __ptr);
		MTY_Free(prev_entry);

		MTY_HashSetInt(CTX.pointers, (int64_t) entry->pointer, entry);

		CTX.entered_pointers = false;
	}

	return ptr;
}

void __wrap_free(void *__ptr)
{
    ensure_initialized();

	__real_free(__ptr);

	if (!CTX.entered_pointers) {
		CTX.entered_pointers = true;

		struct memory_entry *prev_entry = MTY_HashPopInt(CTX.pointers, (int64_t) __ptr);

        if (prev_entry)
			MTY_Free(prev_entry);

		CTX.entered_pointers = false;
	}
}
