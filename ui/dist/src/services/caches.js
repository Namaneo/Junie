export async function getGames() {
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

export async function add(request, response) {
	const cache = await caches.open('games');

	await cache.put(request, response);
}

export async function remove(request) {
	const cache = await caches.open('games');

	await cache.delete(request);
}
