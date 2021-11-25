export module Caches {

    export interface GameRequest {
        request: Request;
        system: string;
        game: string;
    }

    export async function getGames(): Promise<GameRequest[]> {
        const cacheName = (await caches.keys()).find(x => x.startsWith('workbox-runtime'));
        if (!cacheName)
            return [];

        const cache = await caches.open(cacheName);
        const entries = await cache.keys();
        const requests = entries.filter(x => new URL(x.url).pathname.startsWith('/app/games/'));

        return requests.map(request => {
            const url = new URL(request.url);
            const path = url.pathname.replace('/app/games/', '');
            const parts = decodeURI(path).split('/');

            return { request: request, system: parts[0], game: parts[1] }
        });
    }

    export async function remove(request: Request) {
        const cacheName = (await caches.keys()).find(x => x.startsWith('workbox-runtime'));
        if (!cacheName)
            return [];

        const cache = await caches.open(cacheName);
        
        await cache.delete(request);
    }

}

export default Caches;