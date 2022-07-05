const cacheResource = async (resources) => {
    const cache = await caches.open('v1');
    await cache.addAll(resources);
};

const fetchResource = async (request) => {
    const resource = await caches.match(request);
    return resource ?? await fetch(request);
}

self.addEventListener('install', (event) => {
    event.waitUntil(cacheResource([
        '/',
        '/junie.wasm',
        '/manifest.json',

        '/deps/dexie.js',
        '/deps/pwacompat.js',
        '/deps/matoya.js',

        '/res/icon.png',
        '/res/favicon.png',
        '/res/loading.png',
    ]));
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    event.respondWith(fetchResource(event.request));
});
