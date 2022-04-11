#include <cctype>

#include "rml/rml.h"
#include "rml/event.h"
#include "rml/file.h"
#include "rml/render.h"
#include "rml/system.h"
#include "rml/rcss.h"

#include "RmlUi/Debugger.h"

#define CONTEXT_NAME "document"

using namespace Rml;

static struct {
	MTY_App *app;

	JUN_FrontFileInterface *file;
	JUN_FrontRenderInterface *render;
	JUN_FrontSystemInterface *system;

	Input::KeyIdentifier keys[MTY_KEY_MAX];
	Input::KeyModifier modifiers[MTY_KEY_MAX];
} global;

struct MTY_Front {
	const char *name;

	Context *context;
	ElementDocument *document;

	bool clicking;
	bool cancel_click;
	float last_y;
	uint32_t current_modifiers;
};

static void initialize_keys()
{
	global.keys[MTY_KEY_NONE]           = Input::KI_UNKNOWN;
	global.keys[MTY_KEY_ESCAPE]         = Input::KI_ESCAPE;
	global.keys[MTY_KEY_BACKSPACE]      = Input::KI_BACK;
	global.keys[MTY_KEY_TAB]            = Input::KI_TAB;
	global.keys[MTY_KEY_AUDIO_PREV]     = Input::KI_MEDIA_PREV_TRACK;
	global.keys[MTY_KEY_AUDIO_NEXT]     = Input::KI_MEDIA_NEXT_TRACK;
	global.keys[MTY_KEY_ENTER]          = Input::KI_RETURN;
	global.keys[MTY_KEY_NP_ENTER]       = Input::KI_NUMPADENTER;
	global.keys[MTY_KEY_LCTRL]          = Input::KI_LCONTROL;
	global.keys[MTY_KEY_RCTRL]          = Input::KI_RCONTROL;
	global.keys[MTY_KEY_MUTE]           = Input::KI_VOLUME_MUTE;
	global.keys[MTY_KEY_AUDIO_PLAY]     = Input::KI_MEDIA_PLAY_PAUSE;
	global.keys[MTY_KEY_AUDIO_STOP]     = Input::KI_MEDIA_STOP;
	global.keys[MTY_KEY_LSHIFT]         = Input::KI_LSHIFT;
	global.keys[MTY_KEY_VOLUME_DOWN]    = Input::KI_VOLUME_DOWN;
	global.keys[MTY_KEY_VOLUME_UP]      = Input::KI_VOLUME_UP;
	global.keys[MTY_KEY_RSHIFT]         = Input::KI_RSHIFT;
	global.keys[MTY_KEY_PRINT_SCREEN]   = Input::KI_PRINT;
	global.keys[MTY_KEY_CAPS]           = Input::KI_CAPITAL;
	global.keys[MTY_KEY_F1]             = Input::KI_F1;
	global.keys[MTY_KEY_F2]             = Input::KI_F2;
	global.keys[MTY_KEY_F3]             = Input::KI_F3;
	global.keys[MTY_KEY_F4]             = Input::KI_F4;
	global.keys[MTY_KEY_F5]             = Input::KI_F5;
	global.keys[MTY_KEY_F6]             = Input::KI_F6;
	global.keys[MTY_KEY_F7]             = Input::KI_F7;
	global.keys[MTY_KEY_F8]             = Input::KI_F8;
	global.keys[MTY_KEY_F9]             = Input::KI_F9;
	global.keys[MTY_KEY_F10]            = Input::KI_F10;
	global.keys[MTY_KEY_NUM_LOCK]       = Input::KI_NUMLOCK;
	global.keys[MTY_KEY_SCROLL_LOCK]    = Input::KI_SCROLL;
	global.keys[MTY_KEY_PAUSE]          = Input::KI_PAUSE;
	global.keys[MTY_KEY_HOME]           = Input::KI_HOME;
	global.keys[MTY_KEY_UP]             = Input::KI_UP;
	global.keys[MTY_KEY_PAGE_UP]        = Input::KI_PRIOR;
	global.keys[MTY_KEY_LEFT]           = Input::KI_LEFT;
	global.keys[MTY_KEY_RIGHT]          = Input::KI_RIGHT;
	global.keys[MTY_KEY_END]            = Input::KI_END;
	global.keys[MTY_KEY_DOWN]           = Input::KI_DOWN;
	global.keys[MTY_KEY_PAGE_DOWN]      = Input::KI_NEXT;
	global.keys[MTY_KEY_INSERT]         = Input::KI_INSERT;
	global.keys[MTY_KEY_DELETE]         = Input::KI_DELETE;
	global.keys[MTY_KEY_F11]            = Input::KI_F11;
	global.keys[MTY_KEY_F12]            = Input::KI_F12;
	global.keys[MTY_KEY_APP]            = Input::KI_APPS;
	global.keys[MTY_KEY_F13]            = Input::KI_F13;
	global.keys[MTY_KEY_F14]            = Input::KI_F14;
	global.keys[MTY_KEY_F15]            = Input::KI_F15;
	global.keys[MTY_KEY_F16]            = Input::KI_F16;
	global.keys[MTY_KEY_F17]            = Input::KI_F17;
	global.keys[MTY_KEY_F18]            = Input::KI_F18;
	global.keys[MTY_KEY_F19]            = Input::KI_F19;
	global.keys[MTY_KEY_MEDIA_SELECT]   = Input::KI_LAUNCH_MEDIA_SELECT;
}

static void initialize_modifiers()
{
	global.modifiers[MTY_KEY_LCTRL]       = Input::KM_CTRL;
	global.modifiers[MTY_KEY_RCTRL]       = Input::KM_CTRL;
	global.modifiers[MTY_KEY_LSHIFT]      = Input::KM_SHIFT;
	global.modifiers[MTY_KEY_RSHIFT]      = Input::KM_SHIFT;
	global.modifiers[MTY_KEY_LALT]        = Input::KM_ALT;
	global.modifiers[MTY_KEY_RALT]        = Input::KM_ALT;
	global.modifiers[MTY_KEY_CAPS]        = Input::KM_CAPSLOCK;
	global.modifiers[MTY_KEY_NUM_LOCK]    = Input::KM_NUMLOCK;
	global.modifiers[MTY_KEY_SCROLL_LOCK] = Input::KM_SCROLLLOCK;
}

EXPORT_C void JUN_FrontInitialize(MTY_App *app)
{
	global.app = app;

	global.file = new JUN_FrontFileInterface();
	global.render = new JUN_FrontRenderInterface(app);
	global.system = new JUN_FrontSystemInterface();

	SetFileInterface(global.file);
	SetRenderInterface(global.render);
	SetSystemInterface(global.system);

	Initialise();

	initialize_keys();
	initialize_modifiers();
}

EXPORT_C void JUN_FrontAddResource(const char *name, const void *data, size_t size)
{
    global.file->Add(name, data, size);
}

EXPORT_C MTY_Front *JUN_FrontCreate(const char *name, const char *document, const char *font)
{
	MTY_Front *ctx = new MTY_Front();

	ctx->name = name;

	bool loaded = LoadFontFace(font);
	if (!loaded) {
		JUN_FrontDestroy(&ctx);
		return NULL;
	}

	ctx->context = CreateContext(ctx->name, Vector2i());
	if (!ctx->context) {
		JUN_FrontDestroy(&ctx);
		return NULL;
	}

	Debugger::Initialise(ctx->context);

	ctx->document = ctx->context->LoadDocument(document);
	if (!ctx->document) {
		JUN_FrontDestroy(&ctx);
		return NULL;
	}

	SharedPtr<StyleSheetContainer> style_sheet = Factory::InstanceStyleSheetString(default_rcss);
	if (!style_sheet) {
		JUN_FrontDestroy(&ctx);
		return NULL;
	}

	style_sheet = ctx->document->GetStyleSheetContainer()->CombineStyleSheetContainer(*style_sheet);

	ctx->document->SetStyleSheetContainer(style_sheet);
	ctx->document->AddEventListener(EventId::Click, new JUN_FrontEventListener());
	ctx->document->Show();

	return ctx;
}

EXPORT_C void JUN_FrontProcessEvent(MTY_Front *ctx, const MTY_Event *event)
{
	if (!ctx || !ctx->context)
		return;

	switch (event->type)
	{
	case MTY_EVENT_MOTION:
		if (ctx->clicking) {
			ctx->cancel_click = true;
			float delta = event->motion.y - ctx->last_y;
			ctx->context->ProcessMouseWheel(delta / -43.0f, ctx->current_modifiers);

		} else {
			ctx->context->ProcessMouseMove(event->motion.x, event->motion.y, ctx->current_modifiers);
		}
		ctx->last_y = event->motion.y;
		break;
	
	case MTY_EVENT_BUTTON:
		if (event->button.button == MTY_BUTTON_LEFT) {
			ctx->clicking = event->button.pressed;
			ctx->last_y = event->button.y;
		}

		if (ctx->cancel_click) {
			ctx->cancel_click = false;
			break;
		}

		if (event->button.pressed) {
			ctx->context->ProcessMouseButtonDown(event->button.button - 1, ctx->current_modifiers);

		} else {
			ctx->context->ProcessMouseButtonUp(event->button.button - 1, ctx->current_modifiers);
		}
		break;

	case MTY_EVENT_SCROLL:
		if (event->scroll.y != 0)
			ctx->context->ProcessMouseWheel(event->scroll.y / -43.0f, ctx->current_modifiers);
		break;

	case MTY_EVENT_KEY:
		if (event->key.pressed) {
			if (event->key.key == MTY_KEY_F8)
				Debugger::SetVisible(!Debugger::IsVisible());
			if (global.modifiers[event->key.key])
				ctx->current_modifiers |= global.modifiers[event->key.key];
			ctx->context->ProcessKeyDown(global.keys[event->key.key], ctx->current_modifiers);

		} else {
			if (global.modifiers[event->key.key])
				ctx->current_modifiers &= ~global.modifiers[event->key.key];
			ctx->context->ProcessKeyUp(global.keys[event->key.key], ctx->current_modifiers);
		}
		break;

	case MTY_EVENT_TEXT:
		if (std::isprint(event->text[0]) != 0)
			ctx->context->ProcessTextInput(event->text);
		break;

	default:
		break;
	}
}

EXPORT_C MTY_DrawData *JUN_FrontRender(MTY_Front *ctx)
{
	uint32_t window_w = 0, window_h = 0;
    MTY_WindowGetSize(global.app, 0, &window_w, &window_h);

	ctx->context->SetDimensions(Vector2i(window_w, window_h));

    if (!ctx->context->Update())
        return NULL;

    global.render->ClearData();

    if (!ctx->context->Render())
        return NULL;

    return global.render->GetData();
}

EXPORT_C void JUN_FrontDestroy(MTY_Front **front)
{
	if (!front || !*front)
		return;

	MTY_Front *ctx = *front;

	if (ctx->document)
		ctx->context->UnloadDocument(ctx->document);

	if (ctx->context)
	    RemoveContext(CONTEXT_NAME);

	delete ctx;
	*front = NULL;
}

EXPORT_C void JUN_FrontShutdown()
{
    Shutdown();
}
