let library = null;

//Retrieve all supported systems data
export async function getSystems() {
	if (!library) {
		const response = await fetch('api/library');
		library = await response.json();
	}

	return library;;
};

export async function getSystemByGame(gameName) {
	const systems = await getSystems();

	const extension = gameName.split('.').pop();
	const system = systems.find(x => x.extension == extension);

	if (!system)
		throw new Error(`No matching system found for game '${gameName}'`);

	return system;
};

//Retrieve all available games for a given system
export async function getSystem(systemName) {
	const systems = await getSystems();
	const system = systems.find(x => x.name == systemName);

	if (!system)
		throw new Error(`System '${systemName}' could not be found`);

	return system;
};

export async function fetchGame(system, game) {
	const path = `/api/library/${system.name}/${game.rom}`;

	try {
		return await fetch(path).then(response => response.arrayBuffer());

	} catch {
		return null;
	}
}
