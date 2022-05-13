import { Dexie } from 'dexie';
import { Save } from '../entities/save';
import { Cheat } from '../entities/cheat';

async function execute(command) {
	const db = new Dexie('Junie');

	db.version(1).stores({ files: 'path, data' });

	const result = await command(db);

	db.close();

	return result;
}

export async function getSaves() {
	const rawSaves = await execute(db => db.table('files').where('path').startsWith('/save/').toArray());

	return rawSaves.map(file => new Save(file)).reduce((acc, newSave) => {

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
