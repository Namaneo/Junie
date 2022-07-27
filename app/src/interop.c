#include <string.h>

#include "matoya.h"

#include "interop.h"

static char *relative_path(const char *path)
{
	if (strchr(path, '/') == path)
		return MTY_Strdup(path);
	return MTY_SprintfD("%s/data/%s", MTY_GetDir(MTY_DIR_CWD), path);
}

static MTY_Hash *read_dir(const char *path, MTY_Hash *files, size_t *len)
{
	if (!files)
		files = MTY_HashCreate(0);

	MTY_FileList *list = MTY_GetFileList(path, NULL);

	for (size_t i = 0; i < list->len; i++) {
		MTY_FileDesc *desc = &list->files[i];

		if (desc->dir && strstr(desc->name, ".") != desc->name) {
			read_dir(desc->path, files, len);

		} else if (!desc->dir) {
			MTY_HashSetInt(files, *len, MTY_Strdup(desc->path));
			(*len)++;
		}
	}

	MTY_FreeFileList(&list);

	return files;
}

double JUN_InteropGetPixelRatio()
{
	return 1;
}

bool JUN_InteropReadDir(const char *path, size_t index, char **file)
{
	char *rpath = relative_path(path);

	size_t files_len = 0;
	MTY_Hash *files = read_dir(rpath, NULL, &files_len);

	*file = MTY_HashGetInt(files, index);
	if (*file)
		*file = MTY_Strdup(*file);

	MTY_HashDestroy(&files, MTY_Free);
	MTY_Free(rpath);

	return *file != NULL;
}

void *JUN_InteropReadFile(const char *path, size_t *length)
{
	char *rpath = relative_path(path);

	void *file = MTY_ReadFile(rpath, length);

	MTY_Free(rpath);

	return file;
}

void JUN_InteropWriteFile(const char *path, const void *data, size_t length)
{
	char *rpath = relative_path(path);

	MTY_Mkdir(MTY_GetPathPrefix(rpath));
	MTY_WriteFile(rpath, data, length);

	MTY_Free(rpath);
}

void JUN_InteropRemoveFile(const char *path)
{
	char *rpath = relative_path(path);

	MTY_DeleteFile(rpath);

	MTY_Free(rpath);
}
