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

		for (let system of systems) {
			if (!system.games)
				system.games = [];

			const games = installed.filter(x => x.system.name == system.name);
			const local = games.filter(x => !system.games.find(y => x.game.rom == y.rom));

			system.games = [ ...local.map(x => x.game), ...system.games ];

			for (let game of system.games)
				game.installed = !!games.find(x => x.game.rom == game.rom);
		}

		return systems;
	};

	static getSystemCover(system) {
		const dark_mode = window.matchMedia('(prefers-color-scheme: dark)').matches;
		return dark_mode && system.coverDark ? system.coverDark : system.cover;
	}

	static getGameCover(system, game) {
		const cover = game.rom.substring(0, game.rom.lastIndexOf('.')) + '.png';
		const host = 'https://raw.githubusercontent.com';
		const path = `/libretro/libretro-thumbnails/master/${system.full_name}/Named_Boxarts/${cover}`;
		return host + path;
	}

	static async fetchGame(system, game) {
		try {
			const path = `${location.origin}/games/${system.name}/${game.rom}`;
			const response = await fetch(path);
			return response.status == 200 ? await response.arrayBuffer() : null;
		} catch (e) {
			console.error(e);
			return null;
		}
	}
}
