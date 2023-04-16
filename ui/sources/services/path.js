export default class Path {
	/**
	 * @returns {string}
	 */
	static library() {
		return '/library.json';
	}

	/**
	 * @returns {string}
	 */
	static settings() {
		return '/settings.json';
	}

	/**
	 * @param {string} system
	 * @param {string} game
	 * @returns {string}
	 */
	static game(system, game) {
		return `/${system}/${game}`;
	}

	/**
	 * @param {string} system
	 * @param {string} game
	 * @returns {string}
	 */
	static cheat(system, game) {
		return `/${system}/${game}/${game}.cht`;
	}

	/**
	 * @param {string} path
	 * @returns {[system: string, game: string]}
	 */
	static parse(path) {
		const matches = path.match(/\/([^\/]*)\/([^\/]*)/);
		return [ matches[1], matches[2] ];
	}
}
