let initialized = false;

const library = [
	{
		name: "NES",
		fullName: "Nintendo - Nintendo Entertainment System",
		coreName: "QuickNES",
		corePath: "quicknes",
		extension: "nes",
		cover: "nes.png"
	},
	{
		name: "SNES",
		fullName: "Nintendo - Super Nintendo Entertainment System",
		coreName: "Snes9x",
		corePath: "snes9x",
		extension: "smc",
		cover: "snes.png"
	},
	{
		name: "Master System",
		fullName: "Sega - Master System - Mark III",
		coreName: "Genesis Plus GX",
		corePath: "genesis",
		extension: "sms",
		cover: "master-system.png"
	},
	{
		name: "Mega Drive",
		fullName: "Sega - Mega Drive - Genesis",
		coreName: "Genesis Plus GX",
		corePath: "genesis",
		extension: "bin",
		cover: "mega-drive.png"
	},
	{
		name: "Game Boy",
		fullName: "Nintendo - Game Boy",
		coreName: "mGBA",
		corePath: "mgba",
		extension: "gb",
		cover: "game-boy.png"
	},
	{
		name: "Game Boy Color",
		fullName: "Nintendo - Game Boy Color",
		coreName: "mGBA",
		corePath: "mgba",
		extension: "gbc",
		cover: "game-boy-color.png"
	},
	{
		name: "Game Boy Advance",
		fullName: "Nintendo - Game Boy Advance",
		coreName: "mGBA",
		corePath: "mgba",
		extension: "gba",
		cover: "game-boy-advance.png"
	},
	{
		name: "Nintendo DS",
		fullName: "Nintendo - Nintendo DS",
		coreName: "melonDS",
		corePath: "melonds",
		extension: "nds",
		cover: "nintendo-ds.png",
		coverDark: "nintendo-ds-dark.png"
	}
];

async function fetchGames(system) {
	const folder = await fetch(`${location.origin}/games/${system.name}/`);

	const html = document.createElement('html');
	html.innerHTML = await folder.text();

	const elements = Array.from(html.querySelectorAll('a'));
	system.games = elements.map(a => new Object({ 
		name: a.innerText.substring(0, a.innerText.lastIndexOf('.')),
		rom: a.innerText,
	})).filter(game => !game.rom.endsWith('.png'));
}

export async function initialize() {
	if (initialized)
		return;

	await Promise.all(library.map(system => fetchGames(system)));

	initialized = true;
}

export async function getSystems() {
	await initialize();

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
	const path = `${location.origin}/games/${system.name}/${game.rom}`;

	try {
		return await fetch(path).then(response => response.arrayBuffer());

	} catch {
		return null;
	}
}
