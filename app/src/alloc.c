#include "matoya.h"

#include "interop.h"

#include "alloc.h"

#define TOP_ENTRIES 20

struct memory_entry {
	void *pointer;
	size_t size;
	bool local;
};

void *__real_MTY_Alloc(size_t len, size_t size);
void *__real_MTY_Realloc(void *mem, size_t len, size_t size);
void __real_MTY_Free(void *mem);

void *__real_malloc(size_t __size);
void *__real_calloc(size_t __nmemb, size_t __size);
void *__real_realloc(void *__ptr, size_t __size);
void __real_free(void *__ptr);

bool is_local = false;
bool entered_pointers = false;
MTY_Hash *pointers = NULL;

void JUN_DumpMemory() 
{
    entered_pointers = true;

	size_t total_size = 0;
	size_t pointer_count = 0;
	struct memory_entry top[TOP_ENTRIES] = {0};

	uint64_t iter = 0;
	int64_t key = 0;
	while (MTY_HashGetNextKeyInt(pointers, &iter, &key)) {
		struct memory_entry *entry = MTY_HashGetInt(pointers, key);
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

    MTY_Log("pointers: %zu, size: %zu", pointer_count, total_size);
	for (size_t i = 0; i < TOP_ENTRIES; i++)
	    MTY_Log("[%02zu] pointer: %p, size: %zu, local: %d", i + 1, top[i].pointer, top[i].size, top[i].local);

    entered_pointers = false;
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
    is_local = true;
    return __real_MTY_Alloc(len, size);
    is_local = false;
}

void *__wrap_MTY_Realloc(void *mem, size_t len, size_t size)
{
    is_local = true;
    return __real_MTY_Realloc(mem, len, size);
    is_local = false;
}

void __wrap_MTY_Free(void *mem)
{
    is_local = true;
    __real_MTY_Free(mem);
    is_local = false;
}

void *__wrap_malloc(size_t __size)
{
    ensure_initialized();

	void *ptr = __real_malloc(__size);

	if (!entered_pointers) {
		entered_pointers = true;

		struct memory_entry *entry = MTY_Alloc(1, sizeof(struct memory_entry));
		entry->pointer = ptr;
		entry->size = __size;
		entry->local = is_local;

		MTY_HashSetInt(pointers, (int64_t) entry->pointer, entry);

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

		struct memory_entry *entry = MTY_Alloc(1, sizeof(struct memory_entry));
		entry->pointer = ptr;
		entry->size = __nmemb * __size;
		entry->local = is_local;

		MTY_HashSetInt(pointers, (int64_t) entry->pointer, entry);

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

		struct memory_entry *entry = MTY_Alloc(1, sizeof(struct memory_entry));
		entry->pointer = ptr;
		entry->size = __size;
		entry->local = is_local;

		struct memory_entry *prev_entry = MTY_HashGetInt(pointers, (int64_t) __ptr);

		MTY_HashSetInt(pointers, (int64_t) prev_entry->pointer, NULL);
		MTY_HashSetInt(pointers, (int64_t) entry->pointer, entry);
		MTY_Free(prev_entry);

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

		struct memory_entry *prev_entry = MTY_HashGetInt(pointers, (int64_t) __ptr);

        if (prev_entry) {
            MTY_HashSetInt(pointers, (int64_t) prev_entry->pointer, NULL);
			MTY_Free(prev_entry);
        }

		entered_pointers = false;
	}
}
