import { System } from './system';
import { Game } from './game';
import Interop from '../services/interop';
import Path from '../services/path';

export class Cheat {
	/** @type {string} */
	name;

	/** @type {boolean} */
	enabled;

	/** @type {number} */
	order;

	/** @type {string} */
	value;

	/**
	 * @returns {number}
	 */
	static #size() { return 16; };

	/**
	 * @param {WebAssembly.Instance} instance
	 * @param {Cheat[]} cheats
	 * @returns {number}
	 */
	static serialize(instance, cheats) {
		const ptr = instance.exports.calloc(cheats.length + 1, this.#size());
		const view = new DataView(instance.exports.memory.buffer, ptr);

		let offset = 0;
		for (const cheat of cheats) {
			const name    = Interop.serialize(instance, 'string',  cheat.name);
			const enabled = Interop.serialize(instance, 'boolean', cheat.enabled);
			const order   = Interop.serialize(instance, 'number',  cheat.order);
			const value   = Interop.serialize(instance, 'string',  cheat.value);

			view.setUint32(offset + 0,  name,    true);
			view.setUint32(offset + 4,  enabled, true);
			view.setUint32(offset + 8,  order,   true);
			view.setUint32(offset + 12, value,   true);

			offset += this.#size();
		}

		return ptr;
	}

	/**
	 * @param {WebAssembly.Instance} instance
	 * @param {number} ptr
	 * @returns {void}
	 */
	static free(instance, ptr) {
		const view = new DataView(instance.exports.memory.buffer, ptr);

		let offset = 0;
		while (true) {
			const name    = view.getUint32(offset + 0,  true);
			const enabled = view.getUint32(offset + 4,  true);
			const order   = view.getUint32(offset + 8,  true);
			const value   = view.getUint32(offset + 12, true);

			if (!value)
				break;

			Interop.free(instance, 'string',  name);
			Interop.free(instance, 'boolean', enabled);
			Interop.free(instance, 'number',  order);
			Interop.free(instance, 'string',  value);

			offset += this.#size();
		}

		return ptr;
	}
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
