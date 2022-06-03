import { Dexie } from 'dexie';
import { Save } from '../entities/save';
import { Cheat } from '../entities/cheat';
import { Game } from '../entities/game';
import library from '../config/library'

async function execute(command) {
	const db = new Dexie('Junie');
	db.version(2).stores({ files: 'path', games: 'path' });
	const result = await command(db);
	db.close();
	return result;
}

export async function getLibrary(force) {
	if (!force) {
		const file = await execute(db => db.table('files').get('/library.json'));
		if (file)
			return JSON.parse(JSON.stringify(file.data));
	}

	return JSON.parse(JSON.stringify(library));
};

export async function updateLibrary(library) {
	await execute(db => db.table('files').put({ path: '/library.json', data: library}));
}

export async function getSettings() {
	const file = await execute(db => db.table('files').get('/settings.json'));

	const defaults = { 
		language: 'RETRO_LANGUAGE_ENGLISH',
		bindings: { }, // TODO default bindings?
		configurations: { }, // TODO default configurations?
	};

	return JSON.parse(JSON.stringify({ ...defaults, ...file?.data }));
};

export async function updateSettings(settings) {
	await execute(db => db.table('files').put({ path: '/settings.json', data: settings}));

	junie_refresh_files();
}

export async function getSaves() {
	const rawSaves = await execute(db => db.table('files').where('path').startsWith('/save/').toArray());

	return rawSaves.map(file => new Save(file)).reduce((acc, newSave) => {

		const save = acc.find(x => x.game == newSave.game);
		save ? save.files.push(newSave.files[0]) : acc.push(newSave);

		return acc;
	}, []);
};

export async function updateSave(save) {
	for (const file of save.files)
		await execute(db => db.table('files').put(file));

	junie_refresh_files();
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
}

export async function removeSave(save) {
	await execute(db => db.table('files').bulkDelete(save.files.map(x => x.path)));

	junie_refresh_files();
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
}

export async function removeCheat(cheat) {
	await execute(db => db.table('files').delete(cheat.file().path));

	junie_refresh_files();
}

export async function getGames() {
	const games = await execute(db => db.table('games').where('path').startsWith('/games/').toArray());

	return games.map(game => new Game(game.system, game.game));
};

export async function addGame(game, data) {
	const copy = { path: game.path(), ...JSON.parse(JSON.stringify(game)) };
	const file = { path: game.path(), data: new Uint8Array(data) };

	delete copy.system.games;

	await execute(db => db.table('games').put(copy));
	await execute(db => db.table('files').put(file));

	junie_refresh_files();
}

export async function removeGame(game) {
	await execute(db => db.table('games').delete(game.path()));
	await execute(db => db.table('files').delete(game.path()));

	junie_refresh_files();
}
