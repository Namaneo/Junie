import Requests from "../services/requests";

export class Game {
	/** @type {String} */
	system;

	/** @type {String} */
	rom;

	/** @type {String} */
	name;

	/** @type {String} */
	cover;

	/** @type {Boolean} */
	installed;

	/**
	 * @param {string} system
	 * @param {string} rom
	 */
	constructor(system, rom) {
		this.system = system.split(' - ')[1];
		this.rom = rom;
		this.name = rom.substring(0, rom.lastIndexOf('.')).replaceAll(/ \(.*\).*/g, '');
		this.cover = Requests.getGameCover(system, rom);
	}
}
