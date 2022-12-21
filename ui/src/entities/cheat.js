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

	static fromGame(system, game) {
		const obj = new CheatList();

		obj.system = system.name;
		obj.game = game.name;
		obj.cheats = [];

		return obj;
	}

	static fromFile(file) {
		const obj = new CheatList();

		const matches = file.path.match(/(.*)\/(.*)\/(.*).(.*)/)

		obj.system = matches[1];
		obj.game = matches[2];
		obj.cheats = file.data;

		return obj;
	}

	path() {
		return `${this.system}/${this.game}/${this.game}.cht`;
	}
}
