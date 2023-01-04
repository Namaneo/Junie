const version = null;

const resources = [
	'./',
	'./manifest.json',

	'./icons/icon-192.png',
	'./icons/icon-512.png',
	'./icons/icon-apple.png',
	'./icons/favicon.png',
];

const modules = null;

const cacheResources = async () => {
    const cache = await caches.open(version);
    await cache.addAll(resources);
    await cache.addAll(modules);
};

const clearCaches = async () => {
	await clients.claim();
	const keys = await caches.keys()
	for (const key of keys.filter(key => key != version))
		caches.delete(key);
}

const fetchResource = async (request) => {
	const cache = await caches.open(version);
	const resource = await cache.match(request);
    return resource ?? await fetch(request);
}

self.addEventListener('install', (event) => {
    event.waitUntil(cacheResources());
});

self.addEventListener('activate', (event) => {
	event.waitUntil(clearCaches());
});

self.addEventListener('fetch', (event) => {
    event.respondWith(fetchResource(event.request));
});
