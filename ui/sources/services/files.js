import Database from './database';
import { Save } from '../entities/save';
import { CheatList } from '../entities/cheat';
import { Game } from '../entities/game';
import Helpers from '../services/helpers';

export default class Files {
	static async list(...suffixes) {
		let paths = await Database.list();

		if (suffixes)
			paths = paths.filter(p => suffixes.some(s => p.endsWith(s)));

		return paths;
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
			const paths = await Files.list('.sav', '.srm', '.rtc', '.state', '.cht');

			return paths.map(path => new Save(path)).reduce((saves, save) => {
				const found = saves.find(x => x.system == save.system && x.game == save.game);
				found ? found.paths.push(save.paths[0]) : saves.push(save);

				return saves;
			}, []);
		};

		static async fix(save, system, game) {
			for (const path of save.paths) {
				const filename = game.rom.replace(`.${system.extension}`, '');
				const new_path = path.replace(save.system, system.name).replaceAll(save.game, filename);

				const data = await Files.read(path);
				await Files.remove(path);
				await Files.write(new_path, data);
			}
		}

		static async remove(save) {
			for (let path of save.paths)
				await Files.remove(path);
		}
	}

	static Cheats = class {
		static async get() {
			const paths = await Files.list('.cht');

			const files = [];
			for (const path of paths) {
				const data = await Files.read_json(path)
				files.push(CheatList.fromFile(path, data));
			}

			return files;
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
			const paths = await Files.list('.meta');

			const files = [];
			for (const path of paths) {
				const meta = await Files.read_json(path);
				files.push(new Game(meta.system, meta.game));
			}

			return files;
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
