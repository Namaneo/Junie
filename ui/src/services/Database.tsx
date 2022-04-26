import { Dexie } from 'dexie';
import { Cheat } from '../entities/Cheat';
import { Save } from '../entities/Save';
import { Game } from '../interfaces/Game';
import { System } from '../interfaces/System';

export module Database {

	type DatabaseCommand<T> = (db: Dexie) => Promise<T>;

	async function execute<T>(command: DatabaseCommand<T>) {
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
		}, [] as Save[]);
	};

	export async function updateSave(save: Save, system: System, game: Game) {
		for (const file of save.files) {
			const key = file.path;

			const filename = game.rom?.replace(`.${system.extension}`, '');
			file.path = file.path.replace(save.system!, system.name!).replace(save.game!, filename!);

			await execute(db => db.table('files').update(key, file));
		}

		return await getSaves();
	}

	export async function removeSave(save: Save) {
		await execute(db => db.table('files').bulkDelete(save.files.map(x => x.path)));

		return await getSaves();
	}

	export async function getCheats() {
		const rawCheats = await execute(db => db.table('files').where('path').startsWith('/cheats/').toArray());

		return rawCheats.map(file => new Cheat(file));
	};

	export async function updateCheat(cheat: Cheat) {
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

	export async function removeCheat(cheat: Cheat) {
		await execute(db => db.table('files').delete(cheat.file().path));

		return await getCheats();
	}

}

export default Database;
