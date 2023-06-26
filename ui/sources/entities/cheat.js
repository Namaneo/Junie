import { System } from "./system";
import { Game } from "./game";
import Path from "../services/path";

export class Cheat {
	/** @type {string} */
	name;

	/** @type {boolean} */
	enabled;

	/** @type {number} */
	order;

	/** @type {string} */
	value;
}

export class CheatList {
	/** @type {string} */
	system;

	/** @type {string} */
	game;

	/** @type {Cheat[]} */
	cheats;

	/**
	 * @param {System} system
	 * @param {Game} game
	 * @returns {CheatList}
	 */
	static fromGame(system, game) {
		const object = new CheatList();

		object.system = system.name;
		object.game = game.name;
		object.cheats = [];

		return object;
	}

	/**
	 * @param {string} path
	 * @param {Cheat[]} cheats
	 * @returns {CheatList}
	 */
	static fromFile(path, cheats) {
		const object = new CheatList();

		const [system, game] = Path.parse(path);

		object.system = system;
		object.game = game;
		object.cheats = cheats;

		return object;
	}
}
