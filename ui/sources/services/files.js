import Database from './database';
import { Save } from '../entities/save';
import { CheatList } from '../entities/cheat';
import { System } from '../entities/system';
import { Game } from '../entities/game';

export default class Files {
	static #encoder = new TextEncoder();
	static #decoder = new TextDecoder();

	/**
	 * @param {string[]} suffixes
	 * @returns {Promise<string[]>}
	 */
	static async list(...suffixes) {
		const paths = await Database.list();

		return suffixes
			? paths.filter(p => suffixes.some(s => p.endsWith(s)))
			: paths;
	}

	/**
	 * @param {string} path
	 * @returns {Promise<Uint8Array>}
	 */
	static async read(path) {
		return await Database.read(path);
	}

	/**
	 * @template T
	 * @param {string} path
	 * @returns {Promise<T>}
	 */
	static async read_json(path) {
		const file = await Files.read(path);

		return file
			? JSON.parse(this.#decoder.decode(file))
			: null;
	}

	/**
	 * @param {string} path
	 * @param {Uint8Array} data
	 * @returns {Promise<void>}
	 */
	static async write(path, data) {
		await Database.write(path, data);
	}

	/**
	 * @template T
	 * @param {string} path
	 * @param {T} data
	 * @returns {Promise<void>}
	 */
	static async write_json(path, data) {
		const encoded = this.#encoder.encode(JSON.stringify(data));
		await Files.write(path, encoded);
	}

	/**
	 * @param {string} path
	 * @returns {Promise<void>}
	 */
	static async remove(path) {
		await Database.remove(path);
	}

	static Library = class {
		/**
		 * @param {boolean} force
		 * @returns {Promise<System[]>}
		 */
		static async get(force) {
			if (!force)
				return await Files.read_json('/library.json') ?? [];

			const cores = await fetch('cores.json').then(res => res.json());

			const systems = [];
			for (const core of Object.keys(cores)) {
				for (const system of cores[core].systems) {
					systems.push({
						...system,
						lib_name: core,
						core_name: cores[core].name,
						cover: `assets/covers/${system.name}.png`,
					});
				}
			}

			return systems;
		};

		/**
		 * @param {System[]} systems
		 * @returns {Promise<void>}
		 */
		static async update(systems) {
			await Files.write_json('/library.json', systems);
		}
	}

	static Settings = class {
		/**
		 * @returns {Promise<{[key: string]: string}>}
		 */
		static async get() {
			return await Files.read_json('/settings.json') ?? {};
		};

		/**
		 * @param {{[key: string]: string}} settings
		 * @returns {Promise<void>}
		 */
		static async update(settings) {
			await Files.write_json('/settings.json', settings);
		}
	}

	static Saves = class {
		/**
		 * @returns {Promise<Save>}
		 */
		static async get() {
			const paths = await Files.list('.sav', '.srm', '.rtc', '.state', '.cht');

			return paths.map(path => new Save(path)).reduce((saves, save) => {
				const found = saves.find(x => x.system == save.system && x.game == save.game);
				found ? found.paths.push(save.paths[0]) : saves.push(save);

				return saves;
			}, []);
		};

		/**
		 * @param {Save} save
		 * @param {System} system
		 * @param {Game} game
		 * @returns {Promise<void>}
		 */
		static async fix(save, system, game) {
			for (const path of save.paths) {
				const filename = game.rom.replace(`.${system.extension}`, '');
				const new_path = path.replace(save.system, system.name).replaceAll(save.game, filename);

				const data = await Files.read(path);
				await Files.remove(path);
				await Files.write(new_path, data);
			}
		}

		/**
		 * @param {Save} save
		 * @returns {Promise<void>}
		 */
		static async remove(save) {
			for (let path of save.paths)
				await Files.remove(path);
		}
	}

	static Cheats = class {
		/**
		 * @returns {Promise<CheatList[]>}
		 */
		static async get() {
			const paths = await Files.list('.cht');

			const files = [];
			for (const path of paths) {
				const cheats = await Files.read_json(path)
				files.push(CheatList.fromFile(path, cheats));
			}

			return files;
		};

		/**
		 * @param {CheatList} cheatlist
		 * @returns {Promise<void>}
		 */
		static async update(cheatlist) {
			await Files.write_json(cheat.path(), cheatlist.cheats);
		}

		/**
		 * @param {CheatList} cheatlist
		 * @returns {Promise<void>}
		 */
		static async remove(cheatlist) {
			await Files.remove(cheatlist.path());
		}
	}

	static Games = class {
		/**
		 * @returns {Promise<Game[]>}
		 */
		static async get() {
			const systems = await Files.Library.get();
			const extensions = systems.map(x => x.extension);
			const paths = await Files.list(...extensions);

			const files = [];
			for (const path of paths) {
				const system_name = path.split('/')[1];
				const rom_name = path.split('/')[2];

				const system = systems.find(x => x.name == system_name);
				files.push(new Game(system.full_name, rom_name));
			}

			return files;
		};

		/**
		 * @param {string} system
		 * @param {string} rom
		 * @param {Uint8Array} data
		 * @param {Promise<void>}
		 */
		static async add(system, rom, data) {
			await Files.write(`/${system}/${rom}`, data);
		}

		/**
		 * @param {string} system
		 * @param {string} rom
		 * @returns {Promise<void>}
		 */
		static async remove(system, rom) {
			await Files.remove(`/${system}/${rom}`);
		}
	}
}
