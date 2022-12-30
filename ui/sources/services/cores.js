const cores = {};
const tools = {};

function createGraphics() {
	const html = document.querySelector('html');
	html.style.width = '100%';
	html.style.height = '100%';
	html.style.margin = 0;

	const body = document.querySelector('body');
	body.style.width = '100%';
	body.style.height = '100%';
	body.style.background = 'black';
	body.style.overflow = 'hidden';
	body.style.margin = 0;

	const canvas = document.createElement('canvas');
	canvas.id = 'canvas';
	canvas.style.width = '100%';
	canvas.style.height = '100%';
	document.body.appendChild(canvas);

	return canvas;
}

async function createTools() {
	if (tools.module)
		return;

	const origin = location.origin + location.pathname.replace(/\/$/, '');

	tools.module = await (await import(`${origin}/cores/tools.js`)).default();
}

async function createCore(name, graphics) {
	if (cores[name])
		return;

	await createTools();

	const origin = location.origin + location.pathname.replace(/\/$/, '');

	const core = {};
	core.module = await (await import(`${origin}/cores/${name}.js`)).default({ canvas: graphics });

	cores[name] = core;
}

export async function getSettings() {
	if (tools.settings)
		return tools.settings;

	await Promise.allSettled([
		createCore('genesis'),
		createCore('melonds'),
		createCore('mgba'),
		createCore('nestopia'),
		createCore('snes9x'),
	]);

	const get = module => module ? JSON.parse(module.UTF8ToString(module._get_settings())) : [];

	tools.settings = {
		'Genesis Plus GX': get(cores.genesis?.module),
		'melonDS':         get(cores.melonds?.module),
		'mGBA':            get(cores.mgba?.module),
		'Nestopia':        get(cores.nestopia?.module),
		'Snes9x':          get(cores.snes9x?.module),
	};

	delete cores.genesis;
	delete cores.melonds;
	delete cores.mgba;
	delete cores.nestopia;
	delete cores.snes9x;

	return tools.settings;
}

export async function runCore(name, system, rom, settings) {
	const graphics = createGraphics();

	await createCore(name, graphics);

	const module = cores[name].module;

	await module.ccall('start_game', null,
		['string', 'string', 'string'],
		[system, rom, JSON.stringify(settings)],
		{ async: true }
	);

	return new Promise(resolve => {
		const show_ui = (ev) => {
			document.getElementById('root').hidden = !ev.detail;

			if (!ev.detail)
				return;

			window.removeEventListener('show_ui', show_ui);

			graphics.remove();
			delete cores[name];

			resolve();
		}

		window.addEventListener('show_ui', show_ui);
	});
}

async function keysFile(db) {
	await createTools();
	const store = tools.module.IDBStore;

	return new Promise(resolve => {
		store.getStore(db, 'readwrite', (_, store) => {
			const request = store.getAllKeys();
			request.onsuccess = (event) => resolve(event.target.result);
		});
	});
}

async function loadFile(db, id) {
	await createTools();
	const store = tools.module.IDBStore;

	return new Promise(resolve => {
		store.getFile(db, id, (_, data) => resolve(data));
	});
}

async function storeFile(db, id, data) {
	await createTools();
	const store = tools.module.IDBStore;

	return new Promise(resolve => {
		store.setFile(db, id, data, () => resolve());
	});
}

async function removeFile(db, id) {
	await createTools();
	const store = tools.module.IDBStore;

	return new Promise(resolve => {
		store.deleteFile(db, id, () => resolve());
	});
}

export function getFS() {
	return {
		keys: () => keysFile('Junie'),
		get: (path) => loadFile('Junie', path),
		put: (path, data) => storeFile('Junie', path, data),
		delete: (path) => removeFile('Junie', path),
	}
}
