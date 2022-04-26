import { File } from "../interfaces/File";

export class Cheat {
	system?: string;
	game?: string;
    name?: string;

	enabled?: boolean;
	order?: number;
	value?: string;

	constructor(file?: File) {
		this.enabled = true;
		this.order = 0;

		if (file) {
			const data = JSON.parse(atob(file.data));
			this.enabled = data.enabled;
			this.order = data.order;
			this.value = data.value;

			this.system = this.match(file.path, 1);
			this.game = this.match(file.path, 2);
			this.name = this.match(file.path, 3);
		}
	}

	path(): string {
		return `/cheats/${this.system}/${this.game}/${this.name}.cht`;
	}

	file(): File {
		const data = {
			enabled: this.enabled,
			order: this.order,
			value: this.value,
		}

		return { 
			path: this.path(),
			data: btoa(JSON.stringify(data)),
		}
	}

    private match(path: string, index: number) {
		const matches = path.match(/\/cheats\/(.*)\/(.*)\/(.*).cht/);

		if (!matches || matches.length <= index)
			return undefined;

		return matches[index];
	}
}
