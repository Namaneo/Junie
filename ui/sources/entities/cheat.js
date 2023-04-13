import { System } from "./system";
import { Game } from "./game";

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
	 *
	 * @param {string} path
	 * @param {Cheat[]} cheats
	 * @returns
	 */
	static fromFile(path, cheats) {
		const object = new CheatList();

		const matches = path.match(/(.*)\/(.*)\/(.*).(.*)/)

		object.system = matches[1];
		object.game = matches[2];
		object.cheats = cheats;

		return object;
	}

	/**
	 * @returns {string}
	 */
	path() {
		return `${this.system}/${this.game}/${this.game}.cht`;
	}
}
