class Video {
	/** @type {number} */
	frame;

	/** @type {number} */
	width;

	/** @type {number} */
	height;

	/** @type {number} */
	pitch;

	/** @type {number} */
	ratio;
}

class Audio {
	/** @type {number} */
	data;

	/** @type {number} */
	frames;
}

export class Media {
	/** @type {Video} */
	video;

	/** @type {Audio} */
	audio;
}
