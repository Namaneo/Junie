export class Game {
	/** @type {String} */
	system;

	/** @type {String} */
	rom;

	/** @type {String} */
	name;

	/** @type {String} */
	cover;

	/** @type {Boolean} */
	installed;

	constructor(system, rom) {
		const name = rom.substring(0, rom.lastIndexOf('.'));

		this.system = system.split(' - ')[1];
		this.rom = rom;
		this.name = name.replaceAll(/ \(.*\).*/g, '');
		this.cover = `https://thumbnails.libretro.com/${system}/Named_Boxarts/${name}.png`;
	}
}
