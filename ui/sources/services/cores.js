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

	tools.module = await (await import(`${origin}/modules/tools.js`)).default();

	tools.settings = {};
	tools.store = tools.module.IDBStore;
}

async function createCore(name, graphics) {
	if (cores[name])
		return;

	await createTools();

	const origin = location.origin + location.pathname.replace(/\/$/, '');

	const core = {};
	core.module = await (await import(`${origin}/modules/${name}.js`)).default({ canvas: graphics });

	cores[name] = core;
}

async function getCoreSettings(name) {
	await createTools();

	if (tools.settings[name])
		return tools.settings[name];

	await createCore(name);

	const module = cores[name] ? cores[name].module : null;

	tools.settings[name] = module
		? JSON.parse(module.UTF8ToString(module._get_settings()))
		: [];

	delete cores[name];

	return tools.settings[name];
}

export async function getSettings() {
	const cores = await fetch('cores.json').then(res => res.json());

	return Object.keys(cores).reduce((library, key) => {
		library[cores[key].name] = () => getCoreSettings(key);
		return library;
	}, {});
}

export async function runCore(name, system, rom, settings) {
	document.getElementById('root').hidden = true;

	const graphics = createGraphics();
	await createCore(name, graphics);
	const module = cores[name].module;

	const game = rom.replace(/\.[^/.]+$/, '');

	module.setupfs = async () => {
		module.FS.mkdir(`${system}`);
		module.FS.mkdir(`${system}/${game}`);
		module.FS.writeFile(`${system}/${rom}`, await getFS().get(`${system}/${rom}`));

		for (const path of await getFS().keys(`${system}/${game}`)) {
			const file = await getFS().get(path);
			if (file) module.FS.writeFile(path, file);
		}
	};

	module.syncfs = async () => {
		for (const name of module.FS.readdir(`${system}/${game}`)) {
			const path = `${system}/${game}/${name}`;
			if (name != '.' && name != '..')
				await getFS().put(path, module.FS.readFile(path));
		}
	};

	module['onExit'] = async () => {
		clearInterval(module.sync_id);
		await module.syncfs();

		graphics.remove();
		delete cores[name];

		document.getElementById('root').hidden = false;
	}

	await module.setupfs();
	module.sync_id = setInterval(module.syncfs, 1000);

	await module.callMain([system, rom, JSON.stringify(settings)]);
}

async function keysFile(db) {
	await createTools();

	return new Promise(resolve => {
		tools.store.getStore(db, 'readwrite', (_, store) => {
			const request = store.getAllKeys();
			request.onsuccess = (event) => resolve(event.target.result);
		});
	});
}

async function loadFile(db, id) {
	await createTools();

	return new Promise(resolve => {
		tools.store.getFile(db, id, (_, data) => resolve(data));
	});
}

async function storeFile(db, id, data) {
	await createTools();

	return new Promise(resolve => {
		tools.store.setFile(db, id, data, () => resolve());
	});
}

async function removeFile(db, id) {
	await createTools();

	return new Promise(resolve => {
		tools.store.deleteFile(db, id, () => resolve());
	});
}

export function getFS() {
	return {
		keys: async (path) => (await keysFile('Junie')).filter(x => !path || x.startsWith(path)),
		get: (path) => loadFile('Junie', path),
		put: (path, data) => storeFile('Junie', path, data),
		delete: (path) => removeFile('Junie', path),
	}
}
