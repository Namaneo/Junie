// import { encode, decode } from "@msgpack/msgpack/dist";
import { Save } from '../entities/save';
import { Cheat } from '../entities/cheat';
import { Game } from '../entities/game';
import library from '../config/library'
import * as Helpers from '../services/helpers';

async function read(path) {
	const file = await junie_read_file({ path });

	if (file)
		file.data = atob(file.data);

	return file;
}

async function read_json(path) {
	const file = await read(path);

	if (file)
		file.data = JSON.parse(file.data);

	return file;
}

async function read_buffer(path) {
	const file = await read(path);

	if (file)
		file.data = Helpers.To.ArrayBuffer(file.data);

	return file;
}

async function list(path, suffix, func) {
	let paths = await junie_list_files({ path });
	if (suffix)
		paths = paths.filter(x => x.endsWith(suffix));

	const files = [];
	for (let path of paths)
		files.push(await func(path));

	return files;
}

async function list_json(path, suffix) {
	return await list(path, suffix, path => read_json(path));
}

async function list_buffer(path, suffix) {
	return await list(path, suffix, path => read_buffer(path));
}

async function write(path, data) {
	data = btoa(data);
	await junie_write_file({ path, data });
	await new Promise(r => setTimeout(r, 250));
}

async function write_json(path, data) {
	data = JSON.stringify(data);
	await write(path, data);
}

async function write_buffer(path, data) {
	data = Helpers.From.Uint8Array(data);
	await write(path, data);
}

async function remove(path) {
	await junie_remove_file({ path });
	await new Promise(r => setTimeout(r, 250));
}

export async function getLibrary(force) {
	if (!force) {
		const file = await read_json('/library.json');
		if (file)
			return JSON.parse(JSON.stringify(file.data));
	}

	return JSON.parse(JSON.stringify(library));
};

export async function updateLibrary(library) {
	await write_json('/library.json', library);
}

export async function getSettings() {
	const file = await read_json('/settings.json');

	const defaults = {
		language: 'RETRO_LANGUAGE_ENGLISH',
		bindings: { }, // TODO default bindings?
		configurations: { }, // TODO default configurations?
	};

	return JSON.parse(JSON.stringify({ ...defaults, ...file?.data }));
};

export async function updateSettings(settings) {
	await write_json('/settings.json', settings);
}

export async function getSaves() {
	const rawSaves = await list_buffer('/saves');

	return rawSaves.map(file => new Save(file)).reduce((acc, newSave) => {

		const save = acc.find(x => x.game == newSave.game);
		save ? save.files.push(newSave.files[0]) : acc.push(newSave);

		return acc;
	}, []);
};

export async function updateSave(save) {
	for (const file of save.files)
		await write_buffer(file.path, file.data);
}

export async function fixSave(save, system, game) {
	for (const file of save.files) {
		const key = file.path;

		const filename = game.rom?.replace(`.${system.extension}`, '');
		file.path = file.path.replace(save.system, system.name).replace(save.game, filename);

		await remove(key);
		await write_buffer(file.path, file.data);
	}
}

export async function removeSave(save) {
	const paths = save.files.map(x => x.path);
	for (let path of paths)
		await remove(path);
}

export async function getCheats() {
	const rawCheats = await list_json('/cheats');

	return rawCheats.map(file => new Cheat(file));
};

export async function updateCheat(cheat, key) {
	const file = cheat.file();

	await remove(key);
	await write_json(file.path, file.data);
}

export async function removeCheat(cheat) {
	await remove(cheat.file().path);
}

export async function getGames() {
	const games = await list_json('/games', '.meta');

	return games.map(game => new Game(game.data.system, game.data.game));
};

export async function addGame(game, data) {
	const file = {
		path: game.path(),
		data: new Uint8Array(data),
		meta: JSON.parse(JSON.stringify(game))
	};

	delete file.meta.game.installed;
	delete file.meta.system.cover;
	delete file.meta.system.games;

	await write_buffer(file.path, file.data);
	await write_json(file.path + '.meta', file.meta);
}

export async function removeGame(game) {
	await remove(game.path());
	await remove(game.path() + '.meta');
}
