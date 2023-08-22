export default class Interop {
	/** @param {WebAssembly.Memory} memory @param {MessagePort} port @param {number} start_arg @param {string} origin @returns {Promise<void>} */
	init(memory, port, origin, start_arg) { }

	/** @param {string} system @param {string} rom @returns {Promise<void>} */
	Create(system, rom) { }

	/** @returns {Promise<number>} */
	StartGame() { }

	/** @param {number} fast_forward @returns {Promise<void>} */
	Run(fast_forward) { }

	/** @param {number} device @param {number} id @param {number} value @returns {Promise<void>} */
	SetInput(device, id, value) { }

	/** @returns {Promise<void>} */
	Destroy() { }


	/** @returns {Promise<number>} */
	GetPixelFormat() { }

	/** @returns {Promise<number>} */
	GetSampleRate() { }

	/** @returns {Promise<number[]>} */
	GetMedia() { }


	/** @returns {Promise<number>} */
	GetVariables() { }

	/** @param {string} key @param {string} value @returns {Promise<void>} */
	SetVariable(key, value) { }


	/** @returns {Promise<void>} */
	SaveState() { }

	/** @returns {Promise<void>} */
	RestoreState() { }


	/** @returns {Promise<void>} */
	ResetCheats() { }

	/** @param {number} index @param {number} enabled @param {string} code @returns {Promise<void>} */
	SetCheat(index, enabled, code) { }
}
