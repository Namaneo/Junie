import { useEffect, useState } from "react";
import Core from "../services/core";
import Files from "../services/files";

const useStatus = (lib, type, value, update, fn) => {
	const name = `${lib}_junie_${type}`;

	const [state, setState] = useState(value);

	const init = (settings) => {
		if (!settings.hasOwnProperty(name))
			settings[name] = value;
		setState(settings[name]);
	}

	useEffect(() => {
		update(name, state);
		if (fn) fn(state);
	}, [state]);

	return [state, init, setState];
}

export const useCore = (lib) => {
	const [core] = useState(Core.create(lib));

	const [variables, setVariables] = useState(null);
	const [settings, setSettings] = useState(null);
	const [cheats, setCheats] = useState(null);

	const update = async (key, value) => {
		if (!settings)
			return;

		settings[key] = value;
		await Files.Settings.update(settings);
		core.settings(settings);
	}

	const [audio, initAudio, setAudio] = useStatus(lib, 'audio', true, update, (value) => core.audio(value));
	const [speed, initSpeed, setSpeed] = useStatus(lib, 'speed', 1, update, (value) => core.speed(value));
	const [gamepad, initGamepad, setGamepad] = useStatus(lib, 'gamepad', true, update);
	const [joystick, initjoystick, setJoystick] = useStatus(lib, 'joystick', true, update);

	const init = async (system, rom, canvas) => {
		const game = rom.replace(/\.[^/.]+$/, '')

		const settings = await Files.Settings.get();
		const cheats = (await Files.Cheats.get()).find(x => x.system == system && x.game == game)?.cheats;

		initAudio(settings);
		initSpeed(settings);
		initGamepad(settings);
		initjoystick(settings);

		setSettings(settings);
		setCheats(cheats);

		await core.init();
		await core.prepare(system, rom);
		core.start(canvas, settings, cheats);

		setVariables(core.variables());
	}

	return [
		{ current: core, init, update, variables, settings, cheats },
		{ value: audio, set: (value) => setAudio(value) },
		{ value: speed, set: (value) => setSpeed(value) },
		{ value: gamepad, set: (value) => setGamepad(value) },
		{ value: joystick, set: (value) => setJoystick(value) },
	]
}
