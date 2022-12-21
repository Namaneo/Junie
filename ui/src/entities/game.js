export class Game {
	system;
	game;

	constructor(system, game) {
		this.system = system;
		this.game = game;
	}

	path() {
		return `${this.system.name}/${this.game.rom}`;
	}

	meta() {
		return `${this.system.name}/${this.game.name}/${this.game.name}.meta`;
	}
}
