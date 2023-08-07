import Files from './files';
import Parallel from './parallel';

export class CoreInterface {
	/** @param {WebAssembly.Memory} memory @param {MessagePort} port @param {number} start_arg @param {string} origin @returns {Promise<void>} */
	init(memory, port, origin, start_arg) { }

	/** @param {string} system @param {string} rom @returns {Promise<void>} */
	Create(system, rom) { }

	/** @returns {Promise<void>} */
	ResetCheats() { }

	/** @param {number} index @param {number} enabled @param {string} code @returns {Promise<void>} */
	SetCheat(index, enabled, code) { }

	/** @returns {Promise<number>} */
	StartGame() { }

	/** @returns {Promise<number>} */
	GetSampleRate() { }

	/** @returns {Promise<number>} */
	GetVariableCount() { }

	/** @param {number} index @returns {Promise<string>} */
	GetVariableKey(index) { }

	/** @param {number} index @returns {Promise<string>} */
	GetVariableName(index) { }

	/** @param {number} index @returns {Promise<string>} */
	GetVariableOptions(index) { }

	/** @param {string} key @param {string} value @returns {Promise<void>} */
	SetVariable(key, value) { }

	/** @param {number} device @param {number} id @param {number} value @returns {Promise<void>} */
	SetInput(device, id, value) { }

	/** @param {number} fast_forward @returns {Promise<void>} */
	Run(fast_forward) { }

	/** @returns {Promise<number>} */
	GetFrameData() { }

	/** @returns {Promise<number>} */
	GetFrameWidth() { }

	/** @returns {Promise<number>} */
	GetFrameHeight() { }

	/** @returns {Promise<number>} */
	GetAudioData() { }

	/** @returns {Promise<number>} */
	GetAudioFrames() { }

	/** @returns {Promise<void>} */
	SaveState() { }

	/** @returns {Promise<void>} */
	RestoreState() { }

	/** @returns {Promise<void>} */
	Destroy() { }
}

export default class Interop {
	/** @type {Parallel<CoreInterface>} */
	static #parallel = null;

	/** @type {CoreInterface} */
	static #core = null;

	/**
	 * @param {string} name
	 * @param {WebAssembly.Memory} memory
	 * @returns {Promise<CoreInterface>}
	 */
	static async init(name, memory) {
		this.#parallel = new Parallel(CoreInterface, false);

		const origin = location.origin + location.pathname.substring(0, location.pathname.lastIndexOf('/'));

		const script = await (await fetch('worker.js')).text();
		const core = await this.#parallel.create(name, script);
		await core.init(memory, await Files.clone(), origin);

		return core;
	}

	/**
	 * @returns {Promise<void>}
	 */
	static async terminate() {
		this.#parallel.close();
		this.#parallel = null;
	}
}
