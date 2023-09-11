export class Button {
	/** @type {number} */
	id = 0;

	/** @type {DOMRect} */
	rect = null;
}

export class Touch {
	/** @type {string} */
	type = null;

	/** @type {number} */
	id = 0;

	/** @type {number} */
	x = 0;

	/** @type {number} */
	y = 0;
}

export class InputMessage {
	/** @type {number} */
	device = 0;

	/** @type {number} */
	id = 0;

	/** @type {number} */
	value = 0;
}
