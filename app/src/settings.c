#include "settings.h"

#define PATH_SIZE 256

static void set_language(JUN_Settings *context)
{
    char value[PATH_SIZE];
    if (MTY_JSONObjGetString(context->json.root, "language", value, PATH_SIZE))
    {
        context->language = MTY_Strdup(value);
    }
}

static void set_bindings(JUN_Settings *context)
{
    char value[PATH_SIZE];

    const MTY_JSON *bindings = MTY_JSONObjGetItem(context->json.root, "bindings");

    size_t lenght =  MTY_JSONGetLength(bindings);
    for (size_t i = 0; i < lenght; ++i)
    {
        const char *key = MTY_JSONObjGetKey(bindings, i);
        MTY_JSONObjGetString(bindings, key, value, PATH_SIZE);

        MTY_HashSet(context->bindings, key, MTY_Strdup(value));
    }
}

static void set_assets(JUN_Settings *context)
{
    char value[PATH_SIZE];

    const MTY_JSON *assets = MTY_JSONObjGetItem(context->json.root, "assets");

    if (MTY_JSONObjGetString(assets, "menu", value, PATH_SIZE))
    {
        context->assets.menu = MTY_Strdup(value);
    }

    if (MTY_JSONObjGetString(assets, "left", value, PATH_SIZE))
    {
        context->assets.left = MTY_Strdup(value);
    }

    if (MTY_JSONObjGetString(assets, "right", value, PATH_SIZE))
    {
        context->assets.right = MTY_Strdup(value);
    }

    if (MTY_JSONObjGetString(assets, "loading", value, PATH_SIZE))
    {
        context->assets.loading = MTY_Strdup(value);
    }
}

static void set_dependencies(JUN_Settings *context)
{
    char value[PATH_SIZE];

    const MTY_JSON *dependencies = MTY_JSONObjGetItem(context->json.core, "dependencies");

    size_t lenght =  MTY_JSONGetLength(dependencies);
    for (size_t i = 0; i < lenght; ++i)
    {
        MTY_JSONArrayGetString(dependencies, i, value, PATH_SIZE);

        MTY_ListAppend(context->dependencies, MTY_Strdup(value));
    }
}

static void set_configurations(JUN_Settings *context)
{
    char value[PATH_SIZE];

    const MTY_JSON *configurations = MTY_JSONObjGetItem(context->json.core, "configurations");

    size_t lenght =  MTY_JSONGetLength(configurations);
    for (size_t i = 0; i < lenght; ++i)
    {
        const char *key = MTY_JSONObjGetKey(configurations, i);
        MTY_JSONObjGetString(configurations, key, value, PATH_SIZE);

        MTY_HashSet(context->configurations, key, MTY_Strdup(value));
    }
}

JUN_Settings *JUN_SettingsInitialize(char *buffer, char *core_name)
{
    JUN_Settings *context = MTY_Alloc(1, sizeof(JUN_Settings));

    context->json.root = MTY_JSONParse(buffer);
    context->json.core = MTY_JSONObjGetItem(context->json.root, core_name);

    context->dependencies   = MTY_ListCreate();
    context->configurations = MTY_HashCreate(0);
    context->bindings       = MTY_HashCreate(0);

    set_language(context);
    set_assets(context);
    set_bindings(context);

    if (context->json.core)
    {
        set_dependencies(context);
        set_configurations(context);
    }

    return context;
}

void JUN_SettingsDestroy(JUN_Settings **context)
{
    JUN_Settings *ctx = *context;

    MTY_JSONDestroy(&ctx->json.root);

    MTY_ListDestroy(&ctx->dependencies,   MTY_Free);
    MTY_HashDestroy(&ctx->configurations, MTY_Free);
    MTY_HashDestroy(&ctx->bindings,       MTY_Free);

    if (ctx->language) MTY_Free(ctx->language);

    if (ctx->assets.menu)    MTY_Free(ctx->assets.menu);
    if (ctx->assets.left)    MTY_Free(ctx->assets.left);
    if (ctx->assets.right)   MTY_Free(ctx->assets.right);
    if (ctx->assets.loading) MTY_Free(ctx->assets.loading);

    MTY_Free(*context);
    *context = NULL;
}
