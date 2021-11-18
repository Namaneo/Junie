import { Game } from "../interfaces/Game";
import { System } from "../interfaces/System";

//Generic API request sending
async function request<T>(path: string): Promise<T> {
    const response = await fetch(`api/${path}`);
    const data = await response.json();
    return data as T;
};

//Retrieve all supported systems data
export async function getSystems(): Promise<System[]> {
    return await request<System[]>('library');
};

//Retrieve the system cover based on the dark mode preference
export function getSystemCover(system: System) {
    const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const cover = darkMode && system.coverDark ? system.coverDark : system.cover;
    return `assets/${cover}`;
}

//Retrieve all available games for a given system
export async function getGames(systemName: string): Promise<Game[]> {
    const system = await request<System>(`library/${systemName}`);
    return system.games;
};