import { getFS } from './cores';
import { Save } from '../entities/save';
import { CheatList } from '../entities/cheat';
import { Game } from '../entities/game';
import library from '../config/library';

export async function read(path) {
	return await getFS().get(path);
}

export async function read_json(path) {
	let file = await read(path);

	if (file)
		file = JSON.parse(new TextDecoder().decode(file));

	return file;
}

export async function list(func, ...suffixes) {
	let paths = await getFS().keys();

	if (suffixes)
		paths = paths.filter(p => suffixes.some(s => p.endsWith(s)));

	const files = [];
	for (let path of paths)
		files.push({ path, data: await func(path) });

	return files;
}

export async function list_buffer(...suffixes) {
	return await list(path => read(path), ...suffixes);
}

export async function list_json(...suffixes) {
	return await list(path => read_json(path), ...suffixes);
}

export async function write(path, data) {
	await getFS().put(path, data);
}

export async function write_json(path, data) {
	data = new TextEncoder().encode(JSON.stringify(data));
	await write(path, data);
}

export async function remove(path) {
	await getFS().delete(path);
}

export async function getLibrary(force) {
	if (!force) {
		const file = await read_json('library.json');
		if (file)
			return JSON.parse(JSON.stringify(file));
	}

	return JSON.parse(JSON.stringify(library));
};

export async function updateLibrary(library) {
	await write_json('library.json', library);
}

export async function getSettings() {
	return await read_json('settings.json');
};

export async function updateSettings(settings) {
	await write_json('settings.json', settings);
}

export async function getSaves() {
	const rawSaves = await list_buffer('.sav', '.srm', '.rtc', '.state', '.cht');

	return rawSaves.map(file => new Save(file)).reduce((acc, newSave) => {

		const save = acc.find(x => x.game == newSave.game);
		save ? save.files.push(newSave.files[0]) : acc.push(newSave);

		return acc;
	}, []);
};

export async function updateSave(save) {
	for (const file of save.files)
		await write(file.path, file.data);
}

export async function fixSave(save, system, game) {
	for (const file of save.files) {
		const key = file.path;

		const filename = game.rom?.replace(`.${system.extension}`, '');
		file.path = file.path.replace(save.system, system.name).replaceAll(save.game, filename);

		await remove(key);
		await write(file.path, file.data);
	}
}

export async function removeSave(save) {
	const paths = save.files.map(x => x.path);
	for (let path of paths)
		await remove(path);
}

export async function getCheats() {
	const rawCheats = await list_json('.cht');

	return rawCheats.map(file => CheatList.fromFile(file));
};

export async function updateCheat(cheat) {
	await write_json(cheat.path(), cheat.cheats);
}

export async function removeCheat(cheat) {
	await remove(cheat.path());
}

export async function getGames() {
	const games = await list_json('.meta');

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

	await write(game.path(), file.data);
	await write_json(game.meta(), file.meta);
}

export async function removeGame(game) {
	await remove(game.path());
	await remove(game.meta());
}
