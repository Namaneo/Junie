const resources = [
	'/',
	'/junie.wasm',
	'/manifest.json',

	'/deps/dexie.js',
	'/deps/pwacompat.js',
	'/deps/matoya.js',

	'/res/icon.png',
	'/res/favicon.png',
	'/res/loading.png',
];

const cacheResources = async () => {
    const cache = await caches.open('v1');
    await cache.addAll(resources);
    self.skipWaiting();
};

const fetchResource = async (request) => {
    const resource = await caches.match(request);
    return resource ?? await fetch(request);
}

self.addEventListener('install', (event) => {
    event.waitUntil(cacheResources());
});

self.addEventListener('activate', () => {
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    event.respondWith(fetchResource(event.request));
});
