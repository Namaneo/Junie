import { Dexie } from 'dexie';
import { Save } from '../entities/save';
import { Cheat } from '../entities/cheat';
import { Game } from '../entities/game';
import * as Requests from '../services/requests';

async function execute(command) {
	const db = new Dexie('Junie');

	db.version(1).stores({ files: 'path, data' });

	const result = await command(db);

	db.close();

	return result;
}

export async function getSaves() {
	const rawSaves = await execute(db => db.table('files').where('path').startsWith('/save/').toArray());

	const systems = await Requests.getSystems();
	return rawSaves.map(file => new Save(file, systems)).reduce((acc, newSave) => {

		const save = acc.find(x => x.game == newSave.game);
		save ? save.files.push(newSave.files[0]) : acc.push(newSave);

		return acc;
	}, []);
};

export async function updateSave(save, system, game) {
	for (const file of save.files) {
		const key = file.path;

		const filename = game.rom?.replace(`.${system.extension}`, '');
		file.path = file.path.replace(save.system, system.name).replace(save.game, filename);

		await execute(async db => {
			const record = await db.table('files').get(file.path);
			if (record)
				await db.table('files').update(file.path, file);
			else
				await db.table('files').add(file, file.path);
		});
	}

	return await getSaves();
}

export async function removeSave(save) {
	await execute(db => db.table('files').bulkDelete(save.files.map(x => x.path)));

	return await getSaves();
}

export async function getCheats() {
	const rawCheats = await execute(db => db.table('files').where('path').startsWith('/cheats/').toArray());

	return rawCheats.map(file => new Cheat(file));
};

export async function updateCheat(cheat) {
	const file = cheat.file();

	await execute(async db => {
		const record = await db.table('files').get(file.path);
		if (record)
			await db.table('files').update(file.path, file);
		else
			await db.table('files').add(file, file.path);
	});

	return await getCheats();
}

export async function removeCheat(cheat) {
	await execute(db => db.table('files').delete(cheat.file().path));

	return await getCheats();
}

export async function getGames() {
	const rawGames = await execute(db => db.table('files').where('path').startsWith('/games/').toArray());

	const systems = await Requests.getSystems();
	return rawGames.map(file => Game.fromFile(file, systems));
};

export async function addGame(game, data) {
	const file = { path: game.path(), data: new Uint8Array(data) };

	await execute(async db => await db.table('files').add(file, file.path));

	delete file.data;

	return await getGames();
}

export async function removeGame(game) {
	await execute(db => db.table('files').delete(game.path()));

	return await getGames();
}
