#include "settings.h"

#define PATH_SIZE 256

static void set_language(JUN_Settings *this)
{
	char value[PATH_SIZE];
	if (MTY_JSONObjGetString(this->json, "language", value, PATH_SIZE))
		this->language = MTY_Strdup(value);
}

static void set_configurations(JUN_Settings *this)
{
	char value[PATH_SIZE];

	const MTY_JSON *configurations = MTY_JSONObjGetItem(this->json, "configurations");
	if (!configurations)
		return;

	uint64_t iter = 0;
	const char *key = NULL;
	while (MTY_JSONObjGetNextKey(configurations, &iter, &key)) {
		MTY_JSONObjGetString(configurations, key, value, PATH_SIZE);
		MTY_HashSet(this->configurations, key, MTY_Strdup(value));
	}
}

JUN_Settings *JUN_SettingsCreate(const char *json)
{
	JUN_Settings *this = MTY_Alloc(1, sizeof(JUN_Settings));

	this->json = MTY_JSONParse(json);

	this->configurations = MTY_HashCreate(0);

	set_language(this);
	set_configurations(this);

	return this;
}

void JUN_SettingsDestroy(JUN_Settings **settings)
{
	if (!settings || !*settings)
		return;

	JUN_Settings *this = *settings;

	MTY_HashDestroy(&this->configurations, MTY_Free);

	if (this->language)
		MTY_Free(this->language);

	MTY_JSONDestroy(&this->json);

	MTY_Free(this);
	*settings = NULL;
}
