import { Cheat } from '../entities/cheat';
import Audio from './audio';
import Database from './database'

export default class Core {
	static #INITIAL_MEMORY = 400 * 1024 * 1024;

	static #memory = new WebAssembly.Memory({
		initial: this.#INITIAL_MEMORY / 65536,
		maximum: this.#INITIAL_MEMORY / 65536,
		shared: true,
	});

	/** @type {{[name: string]: Core}} */
	static #cores = {};

	/** @type {string} */
	#name = null;

	/** @type {Worker} */
	#worker = null;

	#state = {
		id: 0,
		rom: null,
		speed: 1,
		audio: true,
		timeout: 0,
	}

	constructor(name) {
		this.#name = name;
	}

	#call(name, parameters, transfer) {
		if (!parameters) parameters = [];
		if (!transfer) transfer = [];

		return new Promise(resolve => {
			const worker = this.#worker;
			if (!worker) resolve();

			const id = Number(Math.random().toString().substring(2));

			const on_message = (event) => {
				if (event.data.id != id)
					return;

				worker.removeEventListener('message', on_message);
				resolve(event.data.result);
			}

			worker.addEventListener('message', on_message);
			worker.postMessage({ id, name, parameters }, transfer);
		});
	}

	/**
	 * @param {HTMLCanvasElement} graphics
	 * @returns {Promise<void>}
	 */
	async init(graphics) {
		const offscreen = graphics.transferControlToOffscreen();
		this.#worker = new Worker('worker.js', { name: this.#name });
		await this.#call('init', [Core.#memory, offscreen], [offscreen]);
	}

	/**
	 * @param {string} path
	 * @returns {Promise<void>}
	 */
	async #read(path) {
		const file = await Database.file(path);
		const reader = file.stream().getReader();
		const pointer = await this.#call('GetFileBuffer', [path, file.size]);
		const data = new Uint8Array(Core.#memory.buffer, pointer, file.size);

		let offset = 0;
		await reader.read().then(function process({ done, value }) {
			if (done)
				return;

			data.set(value, offset);
			offset += value.length;

			return reader.read().then(process);
		});
	}

	async prepare(system, rom) {
		const state = this.#state;

		state.rom = `${system}/${rom}`;

		await this.#call('Create', [system, rom]);

		const game_path = `/${system}/${rom.replace(/\.[^/.]+$/, '')}`;
		for (const path of await Database.list(game_path))
			await this.#read(path);
	}

	async #sync(loop) {
		const state = this.#state;

		for (let i = 0; i < await this.#call('CountFiles'); i++) {
			const path = await this.#call('GetFilePath', [i]);
			if (path == state.rom)
				continue;

			const data = await this.#call('ReadFile', [i]);
			const length = await this.#call('GetFileLength', [i]);

			const view = new Uint8Array(Core.#memory.buffer, data, length);
			await Database.write(path, new Uint8Array(view));
		}

		if (loop)
			state.timeout = setTimeout(() => this.#sync(loop), 1000);
	}

	/**
	 * @param {{[key: string]: string}} settings
	 * @param {Cheat[]} cheats
	 * @returns {Promise<void>}
	 */
	async start(settings, cheats) {
		const state = this.#state;

		await this.settings(settings);
		await this.#call('StartGame');
		await this.cheats(cheats);

		this.#sync(true);

		const step = async () => {
			if (!this.#worker)
				return;

			await this.#call('run', [state.speed]);

			const sample_rate = await this.#call('GetSampleRate');
			Audio.update(sample_rate * state.speed, 2);

			if (state.audio) {
				const audio = await this.#call('GetAudioData');
				const frames = await this.#call('GetAudioFrames');
				const audio_view = new Float32Array(Core.#memory.buffer, audio, frames * 2);
				Audio.queue(audio_view);
			}

			state.id = requestAnimationFrame(step);
		}

		state.id = requestAnimationFrame(step);
	}

	async stop() {
		const state = this.#state;

		cancelAnimationFrame(state.id);
		state.audio = false;

		clearTimeout(state.timeout);
		await this.#sync(false);

		await this.#call('Destroy');

		this.#worker.terminate();
		this.#worker = null;

		new Uint8Array(Core.#memory.buffer).fill(0);
	}

	async variables() {
		const variables = [];

		for (let i = 0; i < await this.#call('GetVariableCount'); i++) {
			if (await this.#call('IsVariableLocked', [i]))
				continue;

			const key = await this.#call('GetVariableKey', [i]);
			const name = await this.#call('GetVariableName', [i]);
			const options = (await this.#call('GetVariableOptions', [i])).split('|');

			variables.push({ key, name, options });
		}

		return variables;
	}

	async settings(settings) {
		for (const key in settings)
			await this.#call('SetVariable', [key, settings[key]]);
	}

	async cheats(cheats) {
		await this.#call('ResetCheats');
		const filtered = cheats?.filter(x => x.enabled).sort((x, y) => x.order - y.order);
		for (const cheat of filtered ?? [])
			await this.#call('SetCheat', [cheat.order, true, cheat.value]);
	}

	async send(device, id, value) {
		await this.#call('SetInput', [device, id, value]);
	}

	async save() {
		await this.#call('SaveState');
	}

	async restore() {
		await this.#call('RestoreState');
	}

	speed(value) {
		this.#state.speed = value;
	}

	audio(enable) {
		this.#state.audio = enable;
	}

	static create(name) {
		if (!this.#cores[name])
			this.#cores[name] = new Core(name);
		return this.#cores[name];
	}

	static Device = class {
		static get JOYPAD()  { return 1; }
		static get POINTER() { return 6; }
	}

	static Joypad = class {
		static get B()      { return 0;  }
		static get Y()      { return 1;  }
		static get SELECT() { return 2;  }
		static get START()  { return 3;  }
		static get UP()     { return 4;  }
		static get DOWN()   { return 5;  }
		static get LEFT()   { return 6;  }
		static get RIGHT()  { return 7;  }
		static get A()      { return 8;  }
		static get X()      { return 9;  }
		static get L()      { return 10; }
		static get R()      { return 11; }
	}

	static Pointer = class {
		static get X()       { return 0; }
		static get Y()       { return 1; }
		static get PRESSED() { return 2; }
		static get COUNT()   { return 3; }
	}
}
