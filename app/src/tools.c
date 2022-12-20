#include "matoya.h"
#include "enums.h"
#include "filesystem.h"
#include "debug.h"
#include "core.h"

static struct {
	bool initialized;
} CTX;

static void initialize()
{
	if (CTX.initialized)
		return;

	JUN_SetLogFunc();
	JUN_EnumsCreate();

	CTX.initialized = true;
}

char *get_languages()
{
	initialize();

	MTY_JSON *languages = JUN_EnumsGetAll(JUN_ENUM_LANGUAGE);
	char *serialized = MTY_JSONSerialize(languages);

	MTY_JSONDestroy(&languages);

	return serialized;
}

char *get_bindings()
{
	initialize();

	MTY_JSON *bindings = MTY_JSONObjCreate();
	MTY_JSONObjSetItem(bindings, "joypad", JUN_EnumsGetAll(JUN_ENUM_JOYPAD));
	MTY_JSONObjSetItem(bindings, "keyboard", JUN_EnumsGetAll(JUN_ENUM_KEYBOARD));

	char *serialized = MTY_JSONSerialize(bindings);

	MTY_JSONDestroy(&bindings);

	return serialized;
}

char *get_settings()
{
	initialize();

	return MTY_JSONSerialize(JUN_CoreGetDefaultConfiguration());
}
