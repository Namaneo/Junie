#include <string.h>

#include "matoya.h"

#include "interop.h"

#if !defined(JUNIE_BUILD)
#define JUNIE_BUILD "development"
#endif

#define LOCAL_PATH "./data"

double JUN_InteropGetPixelRatio()
{
	return 1;
}

char *JUN_InteropGetVersion()
{
	return MTY_Strdup(JUNIE_BUILD);
}

static char *jun_interop_prepare(const char *path)
{
	char *full_path = MTY_SprintfD("%s%s", LOCAL_PATH, path);
	MTY_Mkdir(MTY_GetPathPrefix(full_path));
	return full_path;
}

MTY_List *jun_interop_list_files(const char *path, MTY_List *files)
{
	if (!files)
		files = MTY_ListCreate();

	MTY_FileList *list = MTY_GetFileList(path, NULL);

	for (size_t i = 0; i < list->len; i++) {
		const MTY_FileDesc *file = &list->files[i];
		bool special = !strcmp(file->name, ".") || !strcmp(file->name, "..");

		if (!file->dir) {
			MTY_ListAppend(files, MTY_Strdup(file->path));

		} else if (!special) {
			files = jun_interop_list_files(file->path, files);
		}
	}

	return files;
}

bool JUN_InteropReadDir(const char *path, size_t index, char **file)
{
	*file = NULL;

	char *full_path = jun_interop_prepare(path);
	MTY_List *list = jun_interop_list_files(full_path, NULL);
	MTY_Free(full_path);

	size_t position = 0;
	MTY_ListNode *node = MTY_ListGetFirst(list);
	while (node) {
		if (position == index) {
			*file = MTY_Strdup(node->value + strlen(LOCAL_PATH));
			break;
		}

		node = node->next;
		position++;
	}

	MTY_ListDestroy(&list, MTY_Free);

	return *file != NULL;
}

void JUN_InteropReadFile(const char *path, JUN_InteropOnFile callback, void *opaque)
{
	size_t size = 0;
	char *full_path = jun_interop_prepare(path);
	void *data = MTY_ReadFile(full_path, &size);
	MTY_Free(full_path);

	callback(MTY_Strdup(path), data, size, opaque);
}

void JUN_InteropWriteFile(const char *path, const void *data, size_t length)
{
	char *full_path = jun_interop_prepare(path);
	MTY_WriteFile(full_path, data, length);
	MTY_Free(full_path);
}

void JUN_InteropRemoveFile(const char *path)
{
	char *full_path = jun_interop_prepare(path);
	MTY_DeleteFile(full_path);
	MTY_Free(full_path);
}
