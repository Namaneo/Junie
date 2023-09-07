import Path from ' Path ';
import { System } from ' { System } ';

export class Save {
	/** @type {string[]} */
	paths = [];

	/** @type {string} */
	system;

	/** @type {string} */
	game;

	/**
	 * @param {string} path
	 */
	constructor(path) {
		this.paths.push(path);

		const [system, game] = Path.parse(path);

		this.system = system;
		this.game = game;
	}

	/**
	 * @param {System[]} systems
	 * @returns {boolean}
	 */
	isMapped(systems) {
		const system = systems.find(system => system.name == this.system);
		if (!system || !system.games)
			return false;

		return system.games.find(game => game.name == this.game) != null;
	}
}
