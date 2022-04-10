#include "rml/rml.h"
#include "rml/file.h"
#include "rml/render.h"
#include "rml/system.h"

// #include "RmlUi/Debugger.h"

#define CONTEXT_NAME "document"

static struct {
	MTY_App *app;
	Rml::Context *context;
	Rml::ElementDocument *document;

	JunieFileInterface *file;
	JunieRenderInterface *render;
	JunieSystemInterface *system;

	Rml::Input::KeyIdentifier keys[MTY_KEY_MAX];
	Rml::Input::KeyModifier modifiers[MTY_KEY_MAX];

	uint32_t current_modifiers;
} ctx;

static void initialize_keys()
{
	ctx.keys[MTY_KEY_NONE]           = Rml::Input::KI_UNKNOWN;
	ctx.keys[MTY_KEY_ESCAPE]         = Rml::Input::KI_ESCAPE;
	ctx.keys[MTY_KEY_BACKSPACE]      = Rml::Input::KI_BACK;
	ctx.keys[MTY_KEY_TAB]            = Rml::Input::KI_TAB;
	ctx.keys[MTY_KEY_AUDIO_PREV]     = Rml::Input::KI_MEDIA_PREV_TRACK;
	ctx.keys[MTY_KEY_AUDIO_NEXT]     = Rml::Input::KI_MEDIA_NEXT_TRACK;
	ctx.keys[MTY_KEY_ENTER]          = Rml::Input::KI_RETURN;
	ctx.keys[MTY_KEY_NP_ENTER]       = Rml::Input::KI_NUMPADENTER;
	ctx.keys[MTY_KEY_LCTRL]          = Rml::Input::KI_LCONTROL;
	ctx.keys[MTY_KEY_RCTRL]          = Rml::Input::KI_RCONTROL;
	ctx.keys[MTY_KEY_MUTE]           = Rml::Input::KI_VOLUME_MUTE;
	ctx.keys[MTY_KEY_AUDIO_PLAY]     = Rml::Input::KI_MEDIA_PLAY_PAUSE;
	ctx.keys[MTY_KEY_AUDIO_STOP]     = Rml::Input::KI_MEDIA_STOP;
	ctx.keys[MTY_KEY_LSHIFT]         = Rml::Input::KI_LSHIFT;
	ctx.keys[MTY_KEY_VOLUME_DOWN]    = Rml::Input::KI_VOLUME_DOWN;
	ctx.keys[MTY_KEY_VOLUME_UP]      = Rml::Input::KI_VOLUME_UP;
	ctx.keys[MTY_KEY_RSHIFT]         = Rml::Input::KI_RSHIFT;
	ctx.keys[MTY_KEY_PRINT_SCREEN]   = Rml::Input::KI_PRINT;
	ctx.keys[MTY_KEY_CAPS]           = Rml::Input::KI_CAPITAL;
	ctx.keys[MTY_KEY_F1]             = Rml::Input::KI_F1;
	ctx.keys[MTY_KEY_F2]             = Rml::Input::KI_F2;
	ctx.keys[MTY_KEY_F3]             = Rml::Input::KI_F3;
	ctx.keys[MTY_KEY_F4]             = Rml::Input::KI_F4;
	ctx.keys[MTY_KEY_F5]             = Rml::Input::KI_F5;
	ctx.keys[MTY_KEY_F6]             = Rml::Input::KI_F6;
	ctx.keys[MTY_KEY_F7]             = Rml::Input::KI_F7;
	ctx.keys[MTY_KEY_F8]             = Rml::Input::KI_F8;
	ctx.keys[MTY_KEY_F9]             = Rml::Input::KI_F9;
	ctx.keys[MTY_KEY_F10]            = Rml::Input::KI_F10;
	ctx.keys[MTY_KEY_NUM_LOCK]       = Rml::Input::KI_NUMLOCK;
	ctx.keys[MTY_KEY_SCROLL_LOCK]    = Rml::Input::KI_SCROLL;
	ctx.keys[MTY_KEY_PAUSE]          = Rml::Input::KI_PAUSE;
	ctx.keys[MTY_KEY_HOME]           = Rml::Input::KI_HOME;
	ctx.keys[MTY_KEY_UP]             = Rml::Input::KI_UP;
	ctx.keys[MTY_KEY_PAGE_UP]        = Rml::Input::KI_PRIOR;
	ctx.keys[MTY_KEY_LEFT]           = Rml::Input::KI_LEFT;
	ctx.keys[MTY_KEY_RIGHT]          = Rml::Input::KI_RIGHT;
	ctx.keys[MTY_KEY_END]            = Rml::Input::KI_END;
	ctx.keys[MTY_KEY_DOWN]           = Rml::Input::KI_DOWN;
	ctx.keys[MTY_KEY_PAGE_DOWN]      = Rml::Input::KI_NEXT;
	ctx.keys[MTY_KEY_INSERT]         = Rml::Input::KI_INSERT;
	ctx.keys[MTY_KEY_DELETE]         = Rml::Input::KI_DELETE;
	ctx.keys[MTY_KEY_F11]            = Rml::Input::KI_F11;
	ctx.keys[MTY_KEY_F12]            = Rml::Input::KI_F12;
	ctx.keys[MTY_KEY_APP]            = Rml::Input::KI_APPS;
	ctx.keys[MTY_KEY_F13]            = Rml::Input::KI_F13;
	ctx.keys[MTY_KEY_F14]            = Rml::Input::KI_F14;
	ctx.keys[MTY_KEY_F15]            = Rml::Input::KI_F15;
	ctx.keys[MTY_KEY_F16]            = Rml::Input::KI_F16;
	ctx.keys[MTY_KEY_F17]            = Rml::Input::KI_F17;
	ctx.keys[MTY_KEY_F18]            = Rml::Input::KI_F18;
	ctx.keys[MTY_KEY_F19]            = Rml::Input::KI_F19;
	ctx.keys[MTY_KEY_MEDIA_SELECT]   = Rml::Input::KI_LAUNCH_MEDIA_SELECT;
}

static void initialize_modifiers()
{
	ctx.modifiers[MTY_KEY_LCTRL]       = Rml::Input::KM_CTRL;
	ctx.modifiers[MTY_KEY_RCTRL]       = Rml::Input::KM_CTRL;
	ctx.modifiers[MTY_KEY_LSHIFT]      = Rml::Input::KM_SHIFT;
	ctx.modifiers[MTY_KEY_RSHIFT]      = Rml::Input::KM_SHIFT;
	ctx.modifiers[MTY_KEY_LALT]        = Rml::Input::KM_ALT;
	ctx.modifiers[MTY_KEY_RALT]        = Rml::Input::KM_ALT;
	ctx.modifiers[MTY_KEY_CAPS]        = Rml::Input::KM_CAPSLOCK;
	ctx.modifiers[MTY_KEY_NUM_LOCK]    = Rml::Input::KM_NUMLOCK;
	ctx.modifiers[MTY_KEY_SCROLL_LOCK] = Rml::Input::KM_SCROLLLOCK;
}

EXPORT_C void JUN_FrontInitialize(MTY_App *app)
{
	ctx.app = app;

	ctx.file = new JunieFileInterface();
	ctx.render = new JunieRenderInterface(app);
	ctx.system = new JunieSystemInterface();

	Rml::SetFileInterface(ctx.file);
	Rml::SetRenderInterface(ctx.render);
	Rml::SetSystemInterface(ctx.system);

	initialize_keys();
	initialize_modifiers();

	Rml::Initialise();
}

EXPORT_C bool JUN_FrontCreateContext(int32_t window_w, int32_t window_h)
{
	ctx.context = Rml::CreateContext(CONTEXT_NAME, Rml::Vector2i(window_w, window_h));
	if (!ctx.context)
		JUN_FrontShutdown();

	// Rml::Debugger::Initialise(ctx.context);
	// Rml::Debugger::SetVisible(true);

    return ctx.context != NULL;
}

EXPORT_C bool JUN_FrontLoadFont(const void *data, size_t size)
{
    ctx.file->Add(CONTEXT_NAME ".ttf", data, size);

	bool loaded = Rml::LoadFontFace(CONTEXT_NAME ".ttf");
	if (!loaded)
		JUN_FrontShutdown();

    return loaded;
}

EXPORT_C bool JUN_FrontLoadStyle(const void *data, size_t size)
{
    ctx.file->Add(CONTEXT_NAME ".rcss", data, size);

    return true;
}

EXPORT_C bool JUN_FrontLoadDocument(const void *data, size_t size)
{
    ctx.file->Add(CONTEXT_NAME ".rml", data, size);

	ctx.document = ctx.context->LoadDocument(CONTEXT_NAME ".rml");

	if (!ctx.document)
		JUN_FrontShutdown();

	if (ctx.document)
		ctx.document->Show();

    return ctx.document != NULL;
}

EXPORT_C void JUN_FrontProcessEvent(const MTY_Event *event)
{
	if (!ctx.context)
		return;

	switch (event->type)
	{
	case MTY_EVENT_MOTION:
		ctx.context->ProcessMouseMove(event->motion.x, event->motion.y, ctx.current_modifiers);
		break;
	
	case MTY_EVENT_BUTTON:
		if (event->button.pressed) {
			ctx.context->ProcessMouseButtonDown(event->button.button - 1, ctx.current_modifiers);

		} else {
			ctx.context->ProcessMouseButtonUp(event->button.button - 1, ctx.current_modifiers);
		}
		break;

	case MTY_EVENT_SCROLL:
		if (event->scroll.y != 0)
			ctx.context->ProcessMouseWheel(event->scroll.y < 0 ? 2 : -2, ctx.current_modifiers);
		break;

	case MTY_EVENT_KEY:
		if (event->key.pressed) {
			if (ctx.modifiers[event->key.key])
				ctx.current_modifiers |= ctx.modifiers[event->key.key];
			ctx.context->ProcessKeyDown(ctx.keys[event->key.key], ctx.current_modifiers);

		} else {
			if (ctx.modifiers[event->key.key])
				ctx.current_modifiers &= ~ctx.modifiers[event->key.key];
			ctx.context->ProcessKeyUp(ctx.keys[event->key.key], ctx.current_modifiers);
		}
		break;

	case MTY_EVENT_TEXT:
		ctx.context->ProcessTextInput(event->text);
		break;

	default:
		break;
	}
}

EXPORT_C MTY_DrawData *JUN_FrontRender(MTY_App *app)
{
	uint32_t window_w = 0, window_h = 0;
    MTY_WindowGetSize(app, 0, &window_w, &window_h);

	ctx.context->SetDimensions(Vector2i(window_w, window_h));

    if (!ctx.context->Update())
        return NULL;

    ctx.render->ClearData();

    if (!ctx.context->Render())
        return NULL;

    return ctx.render->GetData();
}

EXPORT_C void JUN_FrontShutdown()
{
	if (ctx.document)
		ctx.context->UnloadDocument(ctx.document);
	if (ctx.context)
	    Rml::RemoveContext(CONTEXT_NAME);
    Rml::Shutdown();

	ctx = {0};
}
