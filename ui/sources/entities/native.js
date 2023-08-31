export class Native {
	/** @type {number} */
	variables = 0;

	/** @type {number} */
	video = 0;

	/** @type {number} */
	audio = 0;

	/**
	 * @param {Interop} interop
	 */
	constructor(interop) {
		this.variables = interop.GetVariables();
		this.video = interop.GetVideo();
		this.audio = interop.GetAudio();
	}
}
