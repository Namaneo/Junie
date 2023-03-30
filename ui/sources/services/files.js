import Database from './database';
import { Save } from '../entities/save';
import { CheatList } from '../entities/cheat';
import { Game } from '../entities/game';
import Helpers from '../services/helpers';

export default class Files {
	static async #list(func, ...suffixes) {
		let paths = await Database.list();

		if (suffixes)
			paths = paths.filter(p => suffixes.some(s => p.endsWith(s)));

		const files = [];
		for (let path of paths)
			files.push({ path, data: await func(path) });

		return files;
	}

	static async list(...suffixes) {
		return await Files.#list(path => Files.read(path), ...suffixes);
	}

	static async list_json(...suffixes) {
		return await Files.#list(path => Files.read_json(path), ...suffixes);
	}

	static async read(path) {
		return await Database.read(path);
	}

	static async read_json(path) {
		let file = await Files.read(path);

		if (file)
			file = JSON.parse(new TextDecoder().decode(file));

		return file;
	}

	static async write(path, data) {
		await Database.write(path, data);
	}

	static async write_json(path, data) {
		data = new TextEncoder().encode(JSON.stringify(data));
		await Files.write(path, data);
	}

	static async remove(path) {
		await Database.remove(path);
	}

	static Library = class {
		static async get(force) {
			if (!force)
				return await Files.read_json('library.json') ?? [];

			const cores = await fetch('cores.json').then(res => res.json());

			const library = [];
			for (const core of Object.keys(cores)) {
				for (const system of cores[core].systems) {
					library.push({
						...system,
						lib_name: core,
						core_name: cores[core].name,
						cover: await Helpers.requestDataURL(`./assets/covers/${system.name}.png`),
						coverDark: await Helpers.requestDataURL(`./assets/covers/${system.name}.dark.png`),
					});
				}
			}

			return library;
		};

		static async update(library) {
			await Files.write_json('library.json', library);
		}
	}

	static Settings = class {
		static async get() {
			return await Files.read_json('settings.json') ?? {};
		};

		static async update(settings) {
			await Files.write_json('settings.json', settings);
		}
	}

	static Saves = class {
		static async get() {
			const rawSaves = await Files.list('.sav', '.srm', '.rtc', '.state', '.cht');

			return rawSaves.map(file => new Save(file)).reduce((acc, newSave) => {

				const save = acc.find(x => x.game == newSave.game);
				save ? save.files.push(newSave.files[0]) : acc.push(newSave);

				return acc;
			}, []);
		};

		static async update(save) {
			for (const file of save.files)
				await Files.write(file.path, file.data);
		}

		static async fix(save, system, game) {
			for (const file of save.files) {
				const key = file.path;

				const filename = game.rom?.replace(`.${system.extension}`, '');
				file.path = file.path.replace(save.system, system.name).replaceAll(save.game, filename);

				await Files.remove(key);
				await Files.write(file.path, file.data);
			}
		}

		static async remove(save) {
			const paths = save.files.map(x => x.path);
			for (let path of paths)
				await Files.remove(path);
		}
	}

	static Cheats = class {
		static async get() {
			const rawCheats = await Files.list_json('.cht');

			return rawCheats.map(file => CheatList.fromFile(file));
		};

		static async update(cheat) {
			await Files.write_json(cheat.path(), cheat.cheats);
		}

		static async remove(cheat) {
			await Files.remove(cheat.path());
		}
	}

	static Games = class {
		static async get() {
			const games = await Files.list_json('.meta');

			return games.map(game => new Game(game.data.system, game.data.game));
		};

		static async add(game, data) {
			const file = {
				path: game.path(),
				data: new Uint8Array(data),
				meta: JSON.parse(JSON.stringify(game))
			};

			delete file.meta.game.installed;
			delete file.meta.system.cover;
			delete file.meta.system.games;

			await Files.write(game.path(), file.data);
			await Files.write_json(game.meta(), file.meta);
		}

		static async remove(game) {
			await Files.remove(game.path());
			await Files.remove(game.meta());
		}
	}
}
