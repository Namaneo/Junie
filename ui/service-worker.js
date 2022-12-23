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
	'./cores/quicknes.js',
	'./cores/snes9x.js',
	'./cores/tools.js',
];

const cacheResources = async () => {
    const cache = await caches.open('v1');
    await cache.addAll(resources);
};

const fetchResource = async (request) => {
    const resource = await caches.match(request);
    return resource ?? await fetch(request);
}

self.addEventListener('install', (event) => {
    event.waitUntil(cacheResources());
});

self.addEventListener('fetch', (event) => {
    event.respondWith(fetchResource(event.request));
});
