#include <stdlib.h>
#include <SDL2/SDL.h>

#include "configuration.h"

typedef struct JUN_ConfigurationElement JUN_ConfigurationElement;

struct JUN_Configuration
{
	MTY_Hash *values;
	MTY_Hash *overrides;
};

struct JUN_ConfigurationElement
{
	char *key;
	char *description;
	MTY_List *values;
};

JUN_Configuration *JUN_ConfigurationCreate()
{
	JUN_Configuration *this = calloc(1, sizeof(JUN_Configuration));

	this->values = MTY_HashCreate(0);
	this->overrides = MTY_HashCreate(0);

	return this;
}

char *JUN_ConfigurationGet(JUN_Configuration *this, const char *key)
{
	char *value = MTY_HashGet(this->overrides, key);
	if (value)
		return value;

	JUN_ConfigurationElement *element = MTY_HashGet(this->values, key);
	if (!element)
		return NULL;

	MTY_ListNode *node = MTY_ListGetFirst(element->values);
	if (!node)
		return NULL;

	return (char *) node->value;
}

void JUN_ConfigurationSet(JUN_Configuration *this, const char *key, const char *value)
{
	JUN_ConfigurationElement *element = calloc(1, sizeof(JUN_ConfigurationElement));

	char *content = SDL_strdup(value);

	char *saveptr = NULL;

	element->key = SDL_strdup(key);
	element->description = SDL_strdup(SDL_strtokr(content, ";", &saveptr));
	element->values = MTY_ListCreate();

	char *options = saveptr + 1;
	saveptr = NULL;

	char *config = SDL_strtokr(options, "|", &saveptr);
	while (config) {
		MTY_ListAppend(element->values, SDL_strdup(config));

		config = SDL_strtokr(NULL, "|", &saveptr);
	}

	MTY_HashSet(this->values, key, element);

	free(content);
}

void JUN_ConfigurationOverride(JUN_Configuration *this, const char *key, const char *value)
{
	MTY_HashSet(this->overrides, SDL_strdup(key), SDL_strdup(value));
}

static void free_element(void *ptr)
{
	JUN_ConfigurationElement *element = ptr;

	MTY_ListDestroy(&element->values, free);

	free(element);
}

void JUN_ConfigurationDestroy(JUN_Configuration **configuration)
{
	if (!configuration || !*configuration)
		return;

	JUN_Configuration *this = *configuration;

	MTY_HashDestroy(&this->values, free_element);
	MTY_HashDestroy(&this->overrides, free);

	free(this);
	*configuration = NULL;
}
