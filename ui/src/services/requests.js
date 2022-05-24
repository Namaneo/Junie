import { Dexie } from 'dexie';
import { Save } from '../entities/save';
import { Cheat } from '../entities/cheat';
import { Game } from '../entities/game';
import library from '../config/library'

// Requests

let initialized = false;

async function fetchGames(system) {
	const folder = await fetch(`${location.origin}/games/${system.name}/`);

	const html = document.createElement('html');
	html.innerHTML = await folder.text();

	const elements = Array.from(html.querySelectorAll('a'));
	system.games = elements.map(a => new Object({ 
		name: a.innerText.substring(0, a.innerText.lastIndexOf('.')),
		rom: a.innerText,
	})).filter(game => !game.rom.endsWith('.png'));
}

export async function initialize() {
	if (initialized)
		return;

	await Promise.all(library.map(system => fetchGames(system)));

	initialized = true;
}

export async function getSystems() {
	await initialize();

	return JSON.parse(JSON.stringify(library));
};

export async function getFilteredSystems() {
	const systems = await getSystems();
	const installed = await getGames();

	for (let system of systems) {
		const games = installed.filter(x => x.system.name == system.name);

		system.games = system.games.filter(game =>
			!games.find(x => x.game.rom == game.rom)
		);
	}

	return systems.filter(system => system.games.length);
}

export async function getSystemByGame(gameName) {
	const systems = await getSystems();
	return systems.find(x => x.extension == gameName.split('.').pop());
};

export async function getSystem(systemName) {
	const systems = await getSystems();
	return systems.find(x => x.name == systemName);
};

export function getSystemCover(system) {
	const dark_mode = window.matchMedia('(prefers-color-scheme: dark)').matches;
	return dark_mode && system.coverDark ? system.coverDark : system.cover;
}

export function getGameCover(system, game) {
    const system_name = system.full_name.replaceAll(' ', '_');
    const cover_name = game.rom.substring(0, game.rom.lastIndexOf('.')) + '.png';
    const host = 'https://raw.githubusercontent.com';
    const path = `/libretro-thumbnails/${system_name}/master/Named_Boxarts/${cover_name}`;
    return host + path;
}

export async function fetchGame(system, game) {
	const path = `${location.origin}/games/${system.name}/${game.rom}`;
	return await fetch(path).then(response => response.arrayBuffer());
}

// Database

async function execute(command) {
	const db = new Dexie('Junie');
	db.version(2).stores({ files: 'path' });
	const result = await command(db);
	db.close();
	return result;
}

export async function getSaves() {
	const rawSaves = await execute(db => db.table('files').where('path').startsWith('/save/').toArray());

	const systems = await getSystems();
	return rawSaves.map(file => new Save(file, systems)).reduce((acc, newSave) => {

		const save = acc.find(x => x.game == newSave.game);
		save ? save.files.push(newSave.files[0]) : acc.push(newSave);

		return acc;
	}, []);
};

export async function updateSave(save) {
	for (const file of save.files)
		await execute(db => db.table('files').put(file));

	junie_refresh_files();

	return await getSaves();
}

export async function fixSave(save, system, game) {
	for (const file of save.files) {
		const key = file.path;

		const filename = game.rom?.replace(`.${system.extension}`, '');
		file.path = file.path.replace(save.system, system.name).replace(save.game, filename);

		await execute(async db => db.table('files').delete(key));
		await execute(async db => db.table('files').put(file));
	}

	junie_refresh_files();

	return await getSaves();
}

export async function removeSave(save) {
	await execute(db => db.table('files').bulkDelete(save.files.map(x => x.path)));

	junie_refresh_files();

	return await getSaves();
}

export async function getCheats() {
	const rawCheats = await execute(db => db.table('files').where('path').startsWith('/cheats/').toArray());

	return rawCheats.map(file => new Cheat(file));
};

export async function updateCheat(cheat, key) {
	const file = cheat.file();

	await execute(db => db.table('files').delete(key));
	await execute(db => db.table('files').put(file));

	junie_refresh_files();

	return await getCheats();
}

export async function removeCheat(cheat) {
	await execute(db => db.table('files').delete(cheat.file().path));

	junie_refresh_files();

	return await getCheats();
}

export async function getGames() {
	const rawGames = await execute(db => db.table('files').where('path').startsWith('/games/').primaryKeys());

	const systems = await getSystems();
	return rawGames.map(path => Game.fromPath(path, systems));
};

export async function addGame(game, data) {
	const file = { path: game.path(), data: new Uint8Array(data) };

	await execute(db => db.table('files').put(file, file.path));

	junie_refresh_files();

	return await getGames();
}

export async function removeGame(game) {
	await execute(db => db.table('files').delete(game.path()));

	junie_refresh_files();

	return await getGames();
}
