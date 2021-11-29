export module Caches {

	export interface GameRequest {
		request: Request;
		system: string;
		game: string;
	}

	export async function getGames(): Promise<GameRequest[]> {
		const cache = await caches.open('games');
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
		const cache = await caches.open('games');

		await cache.delete(request);
	}

}

export default Caches;
