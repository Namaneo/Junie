export class InputButton {
	/** @type {number} */
	id = 0;

	/** @type {DOMRect} */
	rect = null;

	/**
	 * @param {HTMLButtonElement} button
	 */
	constructor(button) {
		this.id = Number(button.dataset.id);
		this.rect = button.getBoundingClientRect();
	}
}

export class InputTouch {
	/** @type {string} */
	type = null;

	/** @type {number} */
	id = 0;

	/** @type {number} */
	x = 0;

	/** @type {number} */
	y = 0;

	/**
	 * @param {string} type
	 * @param {Touch} event
	 */
	constructor(type, event) {
		this.type = type;
		this.id = event.identifier ?? 0;
		this.x = event.clientX;
		this.y = event.clientY;
	}
}

export class InputMessage {
	/** @type {number} */
	device = 0;

	/** @type {number} */
	id = 0;

	/** @type {number} */
	value = 0;
}
