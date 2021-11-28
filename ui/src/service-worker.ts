/// <reference lib="webworker" />

import { cacheNames, clientsClaim, skipWaiting } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope;

clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);

registerRoute(/.*/, new StaleWhileRevalidate());

self.addEventListener('install', event => {
	event.waitUntil(
		fetch('cache')
			.then<string[]>(response => response.json())
			.then(urls =>
				caches.open(cacheNames.runtime).then(cache =>
					cache.addAll(urls)
				)
			)
	);
});

skipWaiting();
