const resources = [
	'/',
	'/junie.wasm',
	'/manifest.json',
	'/matoya.js',

	'/deps/dexie.js',

	'/res/icon-192.png',
	'/res/icon-512.png',
	'/res/icon-apple.png',
	'/res/favicon.png',
	'/res/loading.png',
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
