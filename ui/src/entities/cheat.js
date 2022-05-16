export class Cheat {
	system;
	game;
    name;

	enabled;
	order;
	value;

	constructor(file) {
		this.enabled = true;
		this.order = 0;

		if (file) {
			const data = JSON.parse(new TextDecoder('ascii').decode(file.data));
			this.enabled = data.enabled;
			this.order = data.order;
			this.value = data.value;

			this.system = this.match(file.path, 1);
			this.game = this.match(file.path, 2);
			this.name = this.match(file.path, 3);
		}
	}

	path() {
		return `/cheats/${this.system}/${this.game}/${this.name}.cht`;
	}

	file() {
		const data = {
			enabled: this.enabled,
			order: this.order,
			value: this.value,
		}

		return { 
			path: this.path(),
			data: new TextEncoder('ascii').encode((JSON.stringify(data))),
		}
	}

    match(path, index) {
		const matches = path.match(/\/cheats\/(.*)\/(.*)\/(.*).cht/);

		if (!matches || matches.length <= index)
			return undefined;

		return matches[index];
	}
}
