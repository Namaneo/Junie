const version = null;
const resources = null;

const fetchEx = async (request) => {
	const response = await fetch(request);

	const headers = new Headers(response.headers);
	headers.set('Cross-Origin-Opener-Policy', 'same-origin');
	headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
	headers.set('Cross-Origin-Embedder-Policy', 'require-corp');

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers: headers,
	});
}

const cacheResources = async () => {
    const cache = await caches.open(version);

	const requests = [];
	for (const resource of resources) {
		requests.push((async () => {
			const response = await fetchEx(resource);
			await cache.put(resource, response.clone());
		})());
	};

	await Promise.allSettled(requests);
};

const clearCaches = async () => {
	await clients.claim();

	const keys = await caches.keys()
	for (const key of keys.filter(key => key != version && key != 'external'))
		caches.delete(key);
}

const fetchResource = async (request, external) => {
	const localhost = ['localhost', '127.0.0.1'].includes(location.hostname);
	if (localhost && !external)
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
	self.skipWaiting();
    event.waitUntil(cacheResources());
});

self.addEventListener('activate', (event) => {
	event.waitUntil(clearCaches());
});

self.addEventListener('fetch', (event) => {
	const external = !event.request.url.startsWith(location.origin);
	event.respondWith(fetchResource(event.request, external));
});
