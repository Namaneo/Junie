import { Game } from "./game";

export class System {
	/** @type {string} */
	name;

	/** @type {string} */
	full_name;

	/** @type {string} */
	lib_name;

	/** @type {string} */
	core_name;

	/** @type {string} */
	extension;

	/** @type {string} */
	cover;

	/** @type {boolean} */
	cover_dark;

	/** @type {Game[]} */
	games;
}
