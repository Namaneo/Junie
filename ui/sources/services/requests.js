import { Game } from '../entities/game';
import Files from './files';

export default class Requests {
	static async #fetchGames(system) {
		const path = `${location.origin}/games/${system.name}/`;
		const folder = await fetch(path);

		const html = document.createElement('html');
		html.innerHTML = await folder.text();

		const elements = Array.from(html.querySelectorAll('a'));
		const games = elements.map(a => {
			const name = a.innerText.substring(0, a.innerText.lastIndexOf('.'));
			return { name: name, rom: a.innerText, cover: `${path}${name}.png` };
		});

		system.games = games.filter(game => game.rom.endsWith(`.${system.extension}`));
	}

	static async refreshLibrary() {
		try {
			const library = await Files.Library.get(true);
			await Promise.all(library.map(this.#fetchGames));
			await Files.Library.update(library);
		} catch (e) {
			console.error(e);
			return false;
		}
		return true;
	}

	static async getSystems() {
		const systems = await Files.Library.get(false);
		const installed = await Files.Games.get();

		for (const system of systems) {
			if (!system.games)
				system.games = [];

			const games = installed.filter(x => x.system == system.name);
			const local = games.filter(x => !system.games.find(y => x.rom == y.rom));

			system.games = [
				...local.map(x => x.game),
				...system.games.map(x => new Game(system.full_name, x.rom)),
			];

			for (const game of system.games)
				game.installed = !!games.find(x => x.rom == game.rom);
		}

		return systems;
	};

	static shouldInvertCover(system) {
		return system.cover_dark && window.matchMedia('(prefers-color-scheme: dark)').matches;
	}

	static getGameCover(system, game) {
		const cover = game.rom.substring(0, game.rom.lastIndexOf('.')) + '.png';
		return `https://thumbnails.libretro.com/${system.full_name}/Named_Boxarts/${cover}`;
	}

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
