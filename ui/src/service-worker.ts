/// <reference lib="webworker" />

import { cacheNames, clientsClaim, skipWaiting } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope;

clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);

registerRoute(/.*/, new StaleWhileRevalidate());

self.addEventListener('install', (event) => {
	console.log('installed!')
	const urls = [
		'/api/library',

		'/assets/icon.png',
		'/assets/favicon.png',

		'/assets/covers/game-boy.png',
		'/assets/covers/game-boy-color.png',
		'/assets/covers/game-boy-advance.png',
		'/assets/covers/master-system.png',
		'/assets/covers/mega-drive.png',
		'/assets/covers/nes.png',
		'/assets/covers/snes.png',
		'/assets/covers/nintendo-ds.png',
		'/assets/covers/nintendo-ds-dark.png',

		'/app/index.html',
		'/app/matoya.js',
		'/app/emulators.js',
		'/app/database.js',
		'/app/events.js',
		'/app/logging.js',

		'/app/genesis.wasm',
		'/app/melonds.wasm',
		'/app/mgba.wasm',
		'/app/quicknes.wasm',
		'/app/snes9x.wasm',

		'/app/assets/left.png',
		'/app/assets/right.png',
		'/app/assets/menu.png',
		'/app/assets/loading.png',
		'/app/assets/settings.json',
	];

	event.waitUntil(
		caches.open(cacheNames.runtime).then(cache =>
			cache.addAll(urls)
		)
	);
});

skipWaiting();
