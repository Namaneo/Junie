const cacheResource = async (resources) => {
    const cache = await caches.open('v1');
    await cache.addAll(resources);
};

self.addEventListener('install', (event) => {
    event.waitUntil(cacheResource([
        '/',

        '/index.html',
        '/junie.wasm',
        '/manifest.json',

        '/deps/dexie.js',
        '/deps/pwacompat.js',
        '/deps/matoya.js',

        '/res/icon.png',
        '/res/favicon.png',
        '/res/loading.png',
    ]));
});

self.addEventListener('fetch', (event) => {
    event.respondWith(caches.match(event.request));
});
