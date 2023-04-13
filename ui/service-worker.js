const version = null;
const resources = null;
const debug = false;

const cacheResources = async () => {
    const cache = await caches.open(version);
    await cache.addAll(resources);
};

const clearCaches = async () => {
	await clients.claim();
	const keys = await caches.keys()
	for (const key of keys.filter(key => key != version && key != 'external'))
		caches.delete(key);
}

const fetchEx = async (request) => {
	const response = await fetch(request);

	const headers = new Headers(response.headers);
	headers.set('Cross-Origin-Opener-Policy', 'same-origin');
	headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
	headers.set('Cross-Origin-Embedder-Policy', 'credentialless');

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers: headers,
	});
}

const fetchResource = async (request, external) => {
	if (debug && !external)
		return await fetchEx(request);

	const cache = await caches.open(external ? 'external' : version);
	const match = await cache.match(request);
	if (match)
		return match;

	const response = await fetchEx(request);
	if (!external)
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
	const external = !event.request.url.startsWith(location.origin);
	event.respondWith(fetchResource(event.request, external));
});
