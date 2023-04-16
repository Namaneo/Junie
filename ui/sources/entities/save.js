import Path from "../services/path";
import { System } from "./system";

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
	 */
	isMapped(systems) {
		const system = systems.find(system => system.name == this.system);
		if (!system || !system.games)
			return false;

		const game = system.games.find(game => game.rom == `${this.game}.${system.extension}`);
		if (!game)
			return false;

		return true;
	}
}
