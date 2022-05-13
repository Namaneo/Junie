export class Game {
	system;
	game;
	data;

	constructor(data, system, game) {
		this.data = data;
		this.system = system;
		this.game = game;
	}

	static fromFile(file, systems) {
		const system_name = Game.match(file.path, 1);
		const game_rom = Game.match(file.path, 2);

		const data = file.data;
		const system = systems.find(system => system.name == system_name);
		const game = system.games.find(game => game.rom == game_rom);

		if (!game) {
			this.game = {
				name: game_rom,
				rom: game_rom,
				cover: 'assets/placeholder.png'
			}
		}

		return new Game(data, system, game);
	}

	path() {
		return `/games/${this.system.name}/${this.game.rom}`;
	}

	file() {
		return { 
			path: this.path(),
			data: Game.arrayBufferToBase64(this.data),
		}
	}

	static arrayBufferToBase64(buffer) {
		var binary = '';
		var bytes = new Uint8Array(buffer);
		for (var i = 0; i < bytes.byteLength; i++) {
			binary += String.fromCharCode(bytes[i]);
		}
		return window.btoa(binary);
	}

    static match(path, index) {
		const matches = path.match(/\/games\/(.*)\/(.*)/);

		if (!matches || matches.length <= index)
			return undefined;

		return matches[index];
	}
}
