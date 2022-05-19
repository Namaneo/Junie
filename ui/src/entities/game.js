export class Game {
	system;
	game;

	constructor(system, game) {
		this.system = system;
		this.game = game;
	}

	static fromPath(path, systems) {
		const system_name = Game.match(path, 1);
		const game_rom = Game.match(path, 2);

		const system = systems.find(system => system.name == system_name);
		let game = system.games.find(game => game.rom == game_rom);

		if (!game) {
			game = {
				name: game_rom,
				rom: game_rom,
			}
		}

		return new Game(system, game);
	}

	path() {
		return `/games/${this.system.name}/${this.game.rom}`;
	}

    static match(path, index) {
		const matches = path.match(/\/games\/(.*)\/(.*)/);

		if (!matches || matches.length <= index)
			return undefined;

		return matches[index];
	}
}
