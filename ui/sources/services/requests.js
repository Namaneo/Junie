import { Game } from '../entities/game';
import { System } from '../entities/system';
import Files from './files';
import Path from './path';

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
			system.games = elements.map(a => new Object({ name: Path.name(a.innerText), rom: a.innerText }))
				.filter(game => game.rom.includes('.') && game.rom != '.' && !game.rom.endsWith('/') && !game.rom.endsWith('.png'));

		} catch (e) {
			console.error(e);
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
			const games = installed.filter(x => x.system == system.name);

			system.games = [
				...games.filter(x => x.system == system.name),
				...system.games.filter(game => !games.find(installed => game.rom == installed.rom)),
			];

			if (system.name == '2048')
				system.games.push(new Game(system, '2048', true));
		}

		return systems;
	};

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
			const buffer = new Uint8Array(length);

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
