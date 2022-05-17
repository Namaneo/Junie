let library = null;

export async function getSystems() {
	if (!library) {
		const response = await fetch(`${location.origin}/api/library`);
		library = await response.json();
	}

	return JSON.parse(JSON.stringify(library));
};

export async function getSystemByGame(gameName) {
	const systems = await getSystems();

	const extension = gameName.split('.').pop();
	const system = systems.find(x => x.extension == extension);

	if (!system)
		throw new Error(`No matching system found for game '${gameName}'`);

	return system;
};

export async function getSystem(systemName) {
	const systems = await getSystems();
	const system = systems.find(x => x.name == systemName);

	if (!system)
		throw new Error(`System '${systemName}' could not be found`);

	return system;
};

export async function fetchGame(system, game) {
	const path = `${location.origin}/api/library/${system.name}/${game.rom}`;

	try {
		return await fetch(path).then(response => response.arrayBuffer());

	} catch {
		return null;
	}
}
