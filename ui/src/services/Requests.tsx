import { Game } from "../interfaces/Game";
import { System } from "../interfaces/System";

export module Requests {

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

    //Retrieve all available games for a given system
    export async function getSystem(systemName: string): Promise<System> {
        const systems = await getSystems();
        const system = systems.find(x => x.name == systemName);

        if (!system)
            throw new Error(`System '${systemName}' could not be found`);

        return system;
    };

    //Retrieve the system cover based on the dark mode preference
    export function getSystemCover(system: System) {
        const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const cover = darkMode && system.coverDark ? system.coverDark : system.cover;
        return `assets/covers/${cover}`;
    }

}

export default Requests;