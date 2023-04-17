import { Game } from '../entities/game';
import { System } from '../entities/system';
import Files from './files';

export default class Requests {
	/**
	 * @param {System} system
	 * @returns {Promise<void>}
	 */
	static async #fetchGames(system) {
		try {
			const folder = await fetch(`games/${system.name}/`);

			const html = document.createElement('html');
			html.innerHTML = await folder.text();

			const elements = Array.from(html.querySelectorAll('a'));
			const games = elements.map(a => {
				const name = a.innerText.substring(0, a.innerText.lastIndexOf('.'));
				return { name: name, rom: a.innerText };
			});

			system.games = games.filter(game => game.rom.endsWith(`.${system.extension}`));
		} catch (e) {
			system.games = [];
		}
	}

	/**
	 * @returns {Promise<void>}
	 */
	static async refreshLibrary() {
		const library = await Files.Library.get();
		await Promise.all(library.map(this.#fetchGames));
		await Files.Library.update(library);
	}

	/**
	 * @returns {Promise<System[]>}
	 */
	static async getSystems() {
		const systems = await Files.Library.get();
		const installed = await Files.Games.get();

		for (const system of systems) {
			if (!system.games)
				system.games = [];

			const games = installed.filter(x => x.system == system.name);

			system.games = [
				...games.filter(x => !system.games.find(y => x.rom == y.rom)),
				...system.games.map(x => new Game(system, x.rom)),
			];

			for (const game of system.games)
				game.installed = !!games.find(x => x.rom == game.rom);
		}

		return systems;
	};

	/**
	 * @param {System} system
	 * @returns {boolean}
	 */
	static shouldInvertCover(system) {
		return system.cover_dark && window.matchMedia('(prefers-color-scheme: dark)').matches;
	}

	/**
	 * @param {System} system
	 * @param {string} rom
	 * @returns {string}
	 */
	static getGameCover(system, rom) {
		const system_name = system.full_name.replaceAll(' ', '_');
		const cover = rom.substring(0, rom.lastIndexOf('.')) + '.png';

		const host = 'https://raw.githubusercontent.com';
		const path = `/libretro-thumbnails/${system_name}/master/Named_Boxarts/${cover}`;

		return host + path;
	}

	/**
	 *
	 * @param {System} system
	 * @param {Game} game
	 * @param {(progress: number) => void} progress
	 * @returns {Promise<Uint8Array>}
	 */
	static async fetchGame(system, game, progress) {
		try {
			const path = `${location.origin}/games/${system.name}/${game.rom}`;

			const response = await fetch(path);
			const reader = response.body.getReader();

			const length = response.headers.get('Content-Length');
			const buffer = new Uint8Array(new ArrayBuffer(length));

			let offset = 0
			return reader.read().then(function process({ done, value }) {
				if (done)
					return buffer;

				buffer.set(value, offset);
				offset += value.length;

				progress(offset / length);

				return reader.read().then(process);
			});

		} catch (e) {
			console.error(e);
			return null;
		}
	}
}
