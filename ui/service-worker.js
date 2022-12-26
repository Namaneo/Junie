const version = null;

const resources = [
	'./',
	'./manifest.json',

	'./icons/icon-192.png',
	'./icons/icon-512.png',
	'./icons/icon-apple.png',
	'./icons/favicon.png',

	'./cores/genesis.js',
	'./cores/melonds.js',
	'./cores/mgba.js',
	'./cores/nestopia.js',
	'./cores/snes9x.js',
	'./cores/tools.js',
];

const cacheResources = async () => {
    const cache = await caches.open(version);
    await cache.addAll(resources);
};

const clearCaches = async () => {
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
	self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    event.respondWith(fetchResource(event.request));
});
