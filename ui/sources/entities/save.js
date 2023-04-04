export class Save {
	paths = [];

	system;
	game;
	extension;

	constructor(path) {
		this.paths.push(path);

		this.system = this.match(path, 1);
		this.game = this.match(path, 2);
		this.extension = this.match(path, 4);
	}

	isMapped(systems) {
		const system = systems.find(system => system.name == this.system);
		if (!system || !system.games)
			return false;

		const game = system.games.find(game => game.rom == `${this.game}.${system.extension}`);
		if (!game)
			return false;

		return true;
	}

	match(path, index) {
		const matches = path.match(/(.*)\/(.*)\/(.*)\.(.*)/);

		if (!matches || matches.length <= index)
			return undefined;

		return matches[index];
	}
}
