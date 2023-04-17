import { System } from "./system";
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
	 * @param {System} system
	 * @param {string} rom
	 */
	constructor(system, rom) {
		this.system = system.name;
		this.rom = rom;
		this.name = rom.substring(0, rom.lastIndexOf('.')).replaceAll(/ \(.*\).*/g, '');
		this.cover = Requests.getGameCover(system, rom);
	}
}
