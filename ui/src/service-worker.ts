/// <reference lib="webworker" />

import { cacheNames, clientsClaim, skipWaiting } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope;

clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);

registerRoute(/\/games\/.*/, new StaleWhileRevalidate({ cacheName: 'games' }));
registerRoute(/.*/, new StaleWhileRevalidate());

self.clients.matchAll({
	includeUncontrolled: true,
	type: 'window'
}).then(clients => {
	for (let client of clients)
		client.postMessage('install')
});

self.addEventListener('install', event => {
	event.waitUntil(
		fetch('cache')
			.then<string[]>(response => response.json())
			.then(urls => {
				const info = urls.map(url => new Request(url, { redirect: 'follow' }));
				caches.delete(cacheNames.runtime).then(() =>
					caches.open(cacheNames.runtime).then(cache =>
						cache.addAll(info)
					)
				)
			})
	);
});

skipWaiting();
