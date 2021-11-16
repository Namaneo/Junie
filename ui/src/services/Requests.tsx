import { Game } from "../models/Game";
import { System } from "../models/System";

//Generic API request sending
async function request<T>(path: string): Promise<T> {
    const response = await fetch(`api/${path}`);
    const data = await response.json();
    return data as T;
};

//Retrieve all supported systems data
export async function getSystems(): Promise<System[]> {
    const systems: System[] = [];
    const systemNames = await request<string[]>('systems');

    for (let name of systemNames) {
        const system = await request<System>(`systems/${name}`);
        systems.push({ name, ...system });
    }

    return systems;
};

//Retrieve the system cover based on the dark mode preference
export function getSystemCover(system: System) {
    const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const cover = darkMode && system.coverDark ? system.coverDark : system.cover;
    return `assets/${cover}`;
}

export async function getGames(systemName: string): Promise<Game[]> {
    const games: Game[] = [];
    const system = await request<System>(`systems/${systemName}`);
    const gameNames = await request<string[]>(`systems/${systemName}/games`);

    for (let name of gameNames) {
        games.push({
            name: name.replace(/ \(.*\)/g, ''),
            rom: `${name}.${system.extension}`,
            cover: `https://raw.githubusercontent.com/libretro-thumbnails/${system.fullName?.replaceAll(' ', '_')}/master/Named_Boxarts/${name}.png`,
        });
    }

    return games;
};