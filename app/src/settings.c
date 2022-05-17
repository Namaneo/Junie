#include "settings.h"

#define PATH_SIZE 256

static void set_language(JUN_Settings *this)
{
	char value[PATH_SIZE];
	if (MTY_JSONObjGetString(this->json, "language", value, PATH_SIZE))
		this->language = MTY_Strdup(value);
}

static void set_bindings(JUN_Settings *this)
{
	char value[PATH_SIZE];

	const MTY_JSON *bindings = MTY_JSONObjGetItem(this->json, "bindings");

	size_t lenght = MTY_JSONGetLength(bindings);
	for (size_t i = 0; i < lenght; ++i) {
		const char *key = MTY_JSONObjGetKey(bindings, i);
		MTY_JSONObjGetString(bindings, key, value, PATH_SIZE);
		MTY_HashSet(this->bindings, key, MTY_Strdup(value));
	}
}

static void set_configurations(JUN_Settings *this)
{
	char value[PATH_SIZE];

	const MTY_JSON *configurations = MTY_JSONObjGetItem(this->json, this->core_name);
	if (!configurations)
		return;

	size_t lenght = MTY_JSONGetLength(configurations);
	for (size_t i = 0; i < lenght; ++i) {
		const char *key = MTY_JSONObjGetKey(configurations, i);
		MTY_JSONObjGetString(configurations, key, value, PATH_SIZE);
		MTY_HashSet(this->configurations, key, MTY_Strdup(value));
	}
}

JUN_Settings *JUN_SettingsCreate(const char *core_name, const MTY_JSON *json)
{
	JUN_Settings *this = MTY_Alloc(1, sizeof(JUN_Settings));

	this->core_name = core_name;
	this->json = json;

	this->dependencies = MTY_ListCreate();
	this->configurations = MTY_HashCreate(0);
	this->bindings = MTY_HashCreate(0);

	set_language(this);
	set_bindings(this);
	set_configurations(this);

	return this;
}

void JUN_SettingsDestroy(JUN_Settings **settings)
{
	if (!settings || !*settings)
		return;

	JUN_Settings *this = *settings;

	MTY_ListDestroy(&this->dependencies, MTY_Free);
	MTY_HashDestroy(&this->configurations, MTY_Free);
	MTY_HashDestroy(&this->bindings, MTY_Free);

	if (this->language)
		MTY_Free(this->language);

	MTY_Free(this);
	*settings = NULL;
}
