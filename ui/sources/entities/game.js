import { System } from "./system";

export class Game {
	/** @type {String} */
	system;

	/** @type {String} */
	rom;

	/** @type {String} */
	name;

	/** @type {Boolean} */
	installed;

	/**
	 * @param {System} system
	 * @param {string} rom
	 */
	constructor(system, rom) {
		this.system = system.name;
		this.rom = rom;
		this.name = rom.substring(0, rom.lastIndexOf('.')).replaceAll(/ \(.*\).*/g, '');
	}
}
