#include "matoya.h"

#include "rml/rml.h"

#include "document.h"

struct context {
	MTY_App *app;
	MTY_Front *front;
	bool quit;
};

static void event_func(const MTY_Event *evt, void *opaque)
{
	struct context *ctx = opaque;

	MTY_PrintEvent(evt);

	JUN_FrontProcessEvent(ctx->front, evt);

	if (evt->type == MTY_EVENT_CLOSE)
		ctx->quit = true;
}

static bool app_func(void *opaque)
{
	struct context *ctx = opaque;

	MTY_DrawData *dd = JUN_FrontRender(ctx->front);

	if (dd) {
		MTY_WindowDrawUI(ctx->app, 0, dd);
		MTY_WindowPresent(ctx->app, 0, 1);
	}

	return !ctx->quit;
}

int main(int argc, char **argv)
{
	struct context ctx = {0};
	ctx.app = MTY_AppCreate(app_func, event_func, &ctx);
	if (!ctx.app)
		return 1;

	MTY_WindowDesc desc = {
		.title = "My Window",
		.api = MTY_GFX_GL,
		.width = 800,
		.height = 600,
		.vsync = true
	};

	MTY_WindowCreate(ctx.app, &desc);
	MTY_WindowMakeCurrent(ctx.app, 0, true);
	if (MTY_WindowGetGFX(ctx.app, 0) == MTY_GFX_NONE)
		MTY_WindowSetGFX(ctx.app, 0, MTY_GFX_GL, true);

	JUN_FrontInitialize(ctx.app);
	JUN_FrontAddResource("document.rml",  assets_document_rml,  assets_document_rml_len);
	JUN_FrontAddResource("document.rcss", assets_document_rcss, assets_document_rcss_len);
	JUN_FrontAddResource("document.ttf",  assets_document_ttf,  assets_document_ttf_len);
	ctx.front = JUN_FrontCreate("main", "document.rml", "document.ttf");

	MTY_AppRun(ctx.app);

	JUN_FrontDestroy(&ctx.front);
	JUN_FrontShutdown();
	MTY_AppDestroy(&ctx.app);

	return 0;
}
