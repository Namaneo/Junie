import { Game } from "./game";

export class System {
	/** @type {string} */
	name;

	/** @type {string} */
	lib_name;

	/** @type {string} */
	core_name;

	/** @type {string} */
	extension;

	/** @type {boolean} */
	standalone;

	/** @type {Game[]} */
	games;
}
