/// <reference lib="webworker" />

import { cacheNames } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);

registerRoute(/\/games\/.*/, new StaleWhileRevalidate({ cacheName: 'games' }));
registerRoute(/.*/, new StaleWhileRevalidate());

const notify = async (message: string) => {
	const clients = await self.clients.matchAll({
		includeUncontrolled: true,
		type: 'window'
	});

	for (let client of clients)
		client.postMessage(message)
}

const updateCache = async () => {
	const urls = await fetch('cache').then<string[]>(response => response.json());
	const info = urls.map(url => new Request(url, { redirect: 'follow' }));

	await caches.delete(cacheNames.runtime);
	const cache = await caches.open(cacheNames.runtime);
	await cache.addAll(info);

	self.skipWaiting();

	await notify('install');
}

self.addEventListener('install', event => {
	event.waitUntil(updateCache());
});
