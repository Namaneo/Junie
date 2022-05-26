import library from '../config/library'
import * as Database from './database'

// Requests

let initialized = false;

async function fetchGames(system) {
	const path = `${location.origin}/games/${system.name}/`;
	const folder = await fetch(path);

	const html = document.createElement('html');
	html.innerHTML = await folder.text();

	const elements = Array.from(html.querySelectorAll('a'));
	const games = elements.map(a => {
		const name = a.innerText.substring(0, a.innerText.lastIndexOf('.'));
		return { name: name, rom: a.innerText, cover: `${path}${name}.png` };
	});

	system.games = games.filter(game => !game.rom.endsWith('.png'));
}

export async function initialize(force = true) {
	if (!force && initialized)
		return;

	await Promise.all(library.map(fetchGames));

	initialized = true;
}

export async function getSystems(remote) {
	if (remote)
		await initialize(false);

	const systems = JSON.parse(JSON.stringify(library));

	const installed = await Database.getGames();

	for (let system of systems) {
		if (!system.games)
			system.games = [];

		const games = installed.filter(x => x.system.name == system.name);
		const local = games.filter(x => !system.games.find(y => x.game.rom == y.rom));

		system.games = [ ...local.map(x => x.game), ...system.games ];

		for (let game of system.games)
			game.installed = !!games.find(x => x.game.rom == game.rom);
	}

	return systems;
};

export function getSystemCover(system) {
	const dark_mode = window.matchMedia('(prefers-color-scheme: dark)').matches;
	return dark_mode && system.coverDark ? system.coverDark : system.cover;
}

export function getGameCover(system, game) {
    const system_name = system.full_name.replaceAll(' ', '_');
    const cover_name = game.rom.substring(0, game.rom.lastIndexOf('.')) + '.png';
    const host = 'https://raw.githubusercontent.com';
    const path = `/libretro-thumbnails/${system_name}/master/Named_Boxarts/${cover_name}`;
    return host + path;
}

export async function fetchGame(system, game) {
	const path = `${location.origin}/games/${system.name}/${game.rom}`;
	const response = await fetch(path);
	return response.status == 200 ? await response.arrayBuffer() : null;
}
