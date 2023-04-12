const version = null;
const resources = null;

const cacheResources = async () => {
    const cache = await caches.open(version);
    await cache.addAll(resources);
};

const clearCaches = async () => {
	await clients.claim();
	const keys = await caches.keys()
	for (const key of keys.filter(key => key != version && key != 'covers'))
		caches.delete(key);
}

const fetchResource = async (request, cover) => {
	const cache = await caches.open(cover ? 'covers' : version);

	const match = await cache.match(request);
	if (match)
		return match;

	const response = await fetch(request);
	if (!cover)
		return response;

	await cache.put(request, response.clone());

	return response;
}

self.addEventListener('install', (event) => {
    event.waitUntil(cacheResources());
});

self.addEventListener('activate', (event) => {
	event.waitUntil(clearCaches());
});

self.addEventListener('fetch', (event) => {
	const cover = event.request.url.startsWith('https://thumbnails.libretro.com/');
	event.respondWith(fetchResource(event.request, cover));
});
