
import { existsSync, readFileSync, symlinkSync, unlinkSync, writeFileSync } from 'fs';
import { parseArgs } from '@pkgjs/parseargs';
import { spawnSync } from 'child_process';
import { exit } from 'process';
import http from 'http';
import https from 'https';
import esbuild from 'esbuild';
import chokidar from 'chokidar';
import copy from 'esbuild-plugin-copy';
import glob from 'glob';

const { values: options } = parseArgs({ args: process.argv, allowPositionals: true, options: {
	debug: {
		type: 'boolean',
		short: 'd',
		default: false,
	},
	watch: {
		type: 'boolean',
		short: 'w',
		default: false,
	},
	command: {
		type: 'string',
		short: 'w',
		default: undefined,
	},
	version: {
		type: 'string',
		short: 'v',
		default: `Development-${Date.now()}`,
	}
} });

function plugin_html(html, sw) {
	return {
		name: 'html',
		setup(build) {
			const outdir = build.initialOptions.outdir;
			build.onEnd(() => {
				const resources = [
					'./', './index.js', './index.css', './manifest.json', './cores.json', './worker.js', './audio-worker.js',
					...glob.sync(`./${outdir}/modules/**/*.js`).map(x => x.replace(`${outdir}/`, '')),
					...glob.sync(`./${outdir}/modules/**/*.wasm`).map(x => x.replace(`${outdir}/`, '')),
					...glob.sync(`./${outdir}/assets/**/*.png`).map(x => x.replace(`${outdir}/`, ''))
				];

				let code_html = readFileSync(html, 'utf-8');
				code_html = code_html.replace(
					'window.junie_build = null;',
					`window.junie_build = '${options.version}';`
				);

				let code_sw = readFileSync(sw, 'utf-8');
				code_sw = code_sw.replace(
					'const version = null;',
					`const version = '${options.version}';`
				);
				code_sw = code_sw.replace(
					'const resources = null;',
					`const resources = ${JSON.stringify(resources)};`
				);

				writeFileSync(`${outdir}/${html}`, code_html);
				writeFileSync(`${outdir}/${sw}`, code_sw);

				if (existsSync(`${outdir}/games`))
					unlinkSync(`${outdir}/games`);
				if (existsSync('../games'))
					symlinkSync('../../games', `${outdir}/games`);
			});
		},
	};
}

const context = await esbuild.context({
	entryPoints: ['sources/index.jsx', 'sources/worker.js', 'sources/audio-worker.js'],
	outdir: 'build',
	bundle: true,
	format: 'esm',
	jsx: 'automatic',
	minify: !options.debug,
	sourcemap: options.debug ? 'inline' : false,
	plugins: [
		copy({
			assets: [
				{ from: [ '../ui/manifest.json' ], to: [ '.'         ] },
				{ from: [ '../cores/cores.json' ], to: [ '.'         ] },
				{ from: [ '../ui/assets/**/*'   ], to: [ './assets'  ] },
				{ from: [ '../app/build/*'      ], to: [ './modules' ] },
			]
		}),
		plugin_html('index.html', 'service-worker.js'),
	],
});

if (!options.watch) {
	await context.rebuild();
	await context.dispose();
	exit(0);
}

const { host, port } = await context.serve({ servedir: 'build', port: 8000 });

// openssl req -x509 -newkey rsa:4096 -keyout development.key -out development.cert -days 9999 -nodes -subj /CN=127.0.0.1
if (existsSync('development.key') && existsSync('development.cert')) {
	const server_options = {
		key: readFileSync('development.key'),
		cert: readFileSync('development.cert'),
	};

	https.createServer(server_options, (request, response) => {
		const options = {
			hostname: host, port: port, path: request.url,
			method: request.method, headers: request.headers,
		};

		// Forward each incoming request to esbuild
		const proxy_request = http.request(options, proxy_response => {
			proxy_response.headers['Cross-Origin-Opener-Policy'] = 'same-origin';
			proxy_response.headers['Cross-Origin-Resource-Policy'] = 'cross-origin';
			proxy_response.headers['Cross-Origin-Embedder-Policy'] = 'require-corp';

			response.writeHead(proxy_response.statusCode, proxy_response.headers);
			proxy_response.pipe(response, { end: true });
		});

		request.pipe(proxy_request, { end: true });
	}).listen(8001);
}

const watched = [
	'index.html',
	'service-worker.js',
	'manifest.json',
	'sources/**',
	'../GNUmakefile*',
	'../deps/GNUmakefile',
	'../cores/GNUmakefile',
	'../cores/cores.json',
	'../app/GNUmakefile',
	'../app/exports.txt',
	'../app/sources/**',
];

let rebuilding = false;
async function rebuild() {
	if (rebuilding)
		return;

	rebuilding = true;

	console.clear();

	if (options.command) {
		const command = options.command.split(' ')[0];
		const parameters = options.command.split(' ').slice(1);
		spawnSync(command, parameters, { stdio: 'inherit' });
	}

	options.version = `Development-${Date.now()}`;

	await context.rebuild().catch(() => {});
	console.log(`\nBuild finished, serving on 'http://${host}:${port}/'...`);

	rebuilding = false;
}

chokidar.watch(watched, { ignoreInitial: true })
	.once('ready', rebuild)
	.on('all', rebuild);
