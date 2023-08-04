import Caller from './caller';

export default class Interop {
	/** @type {string} */
	static #name = null;

	/** @type {WebAssembly.Memory} */
	static #memory = null;

	/** @type {Worker} */
	static #worker = null;

	/** @type {Worker[]} */
	static #threads = [];

	/** @type {Worker} */
	static get worker() { return this.#worker; }

	/**
	 * @param {string} name
	 * @param {WebAssembly.Memory} memory
	 * @returns {Promise<void>}
	 */
	static async init(name, memory) {
		this.#name = name;
		this.#memory = memory;
		this.#worker = new Worker('worker.js', { name, type: 'module' });

		Caller.receive(Interop.worker, Interop);
		await Caller.call(Interop.worker, 'init', memory);
	}

	/**
	 * @param {number} start_arg
	 * @param {Int32Array} sync
	 * @returns {number}
	 */
	static async spawn(start_arg) {
		const id = this.#threads.length + 1;

		const name = `${this.#name}-${id}`;
		const worker = new Worker('worker.js', { name, type: 'module' });

		Caller.receive(worker, Interop);
		Caller.call(worker, 'init', this.#memory, start_arg);

		this.#threads.push(worker);

		return id;
	}

	/**
	 * @returns {Promise<void>}
	 */
	static async terminate() {
		await Interop.Core.Destroy();

		this.#worker.terminate();
		this.#worker = null;

		this.#threads.forEach(thread => thread.terminate());
		this.#threads = [];
	}

	static Core = class {
		/** @param {string} system @param {string} rom @returns {Promise<void>} */
		static Create(system, rom) { return Caller.call(Interop.worker, 'JUN_CoreCreate', system, rom); }

		/** @returns {Promise<void>} */
		static ResetCheats() { return Caller.call(Interop.worker, 'JUN_CoreResetCheats'); }

		/** @param {number} index @param {number} enabled @param {string} code @returns {Promise<void>} */
		static SetCheat(index, enabled, code) { return Caller.call(Interop.worker, 'JUN_CoreSetCheat', index, enabled, code); }

		/** @returns {Promise<number>} */
		static StartGame() { return Caller.call(Interop.worker, 'JUN_CoreStartGame'); }

		/** @returns {Promise<number>} */
		static GetSampleRate() { return Caller.call(Interop.worker, 'JUN_CoreGetSampleRate'); }

		/** @returns {Promise<number>} */
		static GetVariableCount() { return Caller.call(Interop.worker, 'JUN_CoreGetVariableCount'); }

		/** @param {number} index @returns {Promise<string>} */
		static GetVariableKey(index) { return Caller.call(Interop.worker, 'JUN_CoreGetVariableKey', index); }

		/** @param {number} index @returns {Promise<string>} */
		static GetVariableName(index) { return Caller.call(Interop.worker, 'JUN_CoreGetVariableName', index); }

		/** @param {number} index @returns {Promise<string>} */
		static GetVariableOptions(index) { return Caller.call(Interop.worker, 'JUN_CoreGetVariableOptions', index); }

		/** @param {string} key @param {string} value @returns {Promise<void>} */
		static SetVariable(key, value) { return Caller.call(Interop.worker, 'JUN_CoreSetVariable', key, value); }

		/** @param {number} device @param {number} id @param {number} value @returns {Promise<void>} */
		static SetInput(device, id, value) { return Caller.call(Interop.worker, 'JUN_CoreSetInput', device, id, value); }

		/** @param {number} fast_forward @returns {Promise<void>} */
		static Run(fast_forward) { return Caller.call(Interop.worker, 'JUN_CoreRun', fast_forward); }

		/** @returns {Promise<number>} */
		static GetFrameData() { return Caller.call(Interop.worker, 'JUN_CoreGetFrameData'); }

		/** @returns {Promise<number>} */
		static GetFrameWidth() { return Caller.call(Interop.worker, 'JUN_CoreGetFrameWidth'); }

		/** @returns {Promise<number>} */
		static GetFrameHeight() { return Caller.call(Interop.worker, 'JUN_CoreGetFrameHeight'); }

		/** @returns {Promise<number>} */
		static GetAudioData() { return Caller.call(Interop.worker, 'JUN_CoreGetAudioData'); }

		/** @returns {Promise<number>} */
		static GetAudioFrames() { return Caller.call(Interop.worker, 'JUN_CoreGetAudioFrames'); }

		/** @returns {Promise<void>} */
		static SaveState() { return Caller.call(Interop.worker, 'JUN_CoreSaveState'); }

		/** @returns {Promise<void>} */
		static RestoreState() { return Caller.call(Interop.worker, 'JUN_CoreRestoreState'); }

		/** @returns {Promise<void>} */
		static Destroy() { return Caller.call(Interop.worker, 'JUN_CoreDestroy'); }
	}
}
