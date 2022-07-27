export class Game {
	system;
	game;

	constructor(system, game) {
		this.system = system;
		this.game = game;
	}

	path() {
		return `games/${this.system.name}/${this.game.rom}`;
	}

    static match(path, index) {
		const matches = path.match(/games\/(.*)\/(.*)/);

		if (!matches || matches.length <= index)
			return undefined;

		return matches[index];
	}
}
