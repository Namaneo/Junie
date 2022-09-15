export class Save {
	files = [];

	system;
	game;
	extension;

	constructor(file) {
		this.files.push(file);

		this.system = this.match(1);
		this.game = this.match(2);
		this.extension = this.match(3);
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

	match(index) {
		const matches = this.files[0].path.match(/\/saves\/(.*)\/(.*)\.(.*)/);

		if (!matches)
			return undefined;

		return matches[index];
	}
}
