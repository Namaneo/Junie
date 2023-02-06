
import { readFileSync, unlinkSync, writeFileSync } from 'fs';
import { parseArgs } from '@pkgjs/parseargs';
import { spawnSync } from 'child_process';
import { exit } from 'process';
import esbuild from 'esbuild';
import chokidar from 'chokidar';
import copy from 'esbuild-plugin-copy';
import path from 'path';
import glob from 'glob';

const { values: options } = parseArgs({ args: process.argv, allowPositionals: true, options: {
	debug: {
		type: 'boolean',
		short: 'd',
		default: false,
	},
	watch: {
		type: 'string',
		short: 'w',
		default: undefined,
	},
	version: {
		type: 'string',
		short: 'v',
		default: Date.now().toString(),
	}
} });

function plugin_html(html, sw) {
	return {
		name: 'html',
		setup(build) {
			const outdir = build.initialOptions.outdir;
			build.onEnd(() => {
				const css = readFileSync(path.join(outdir, "index.css")).toString("base64");
				const js = readFileSync(path.join(outdir, "index.js")).toString("base64");

				const resources = [
					'./', './manifest.json', './cores.json',
					...glob.sync(`./${outdir}/modules/**/*.js`).map(x => x.replace(`${outdir}/`, '')),
					...glob.sync(`./${outdir}/modules/**/*.wasm`).map(x => x.replace(`${outdir}/`, '')),
					...glob.sync(`./${outdir}/assets/**/*.png`).map(x => x.replace(`${outdir}/`, ''))
				];

				let code_html = readFileSync(html, 'utf-8');
				code_html = code_html.replace(
					'window.junie_build = null;',
					`window.junie_build = '${options.version}';`
				);
				code_html = code_html.replace(
					'const css = null;',
					`const css = '${css}';`
				);
				code_html = code_html.replace(
					'const source = null;',
					`const source = '${js}';`
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

				unlinkSync(path.join(outdir, "index.css"));
				unlinkSync(path.join(outdir, "index.js"));
			});
		},
	};
}

const context = await esbuild.context({
	entryPoints: ['sources/index.jsx'],
	outdir: 'build',
	bundle: true,
	format: 'iife',
	loader: { '.png': 'dataurl' },
	jsx: 'automatic',
	minify: !options.debug,
	sourcemap: options.debug ? 'inline' : false,
	plugins: [
		copy({
			assets: [
				{ from: [ '../ui/manifest.json' ], to: [ '.' ]         },
				{ from: [ '../cores/cores.json' ], to: [ '.' ]         },
				{ from: [ '../ui/assets/**/*' ],   to: [ './assets' ]  },
				{ from: [ '../app/build/*' ],      to: [ './modules' ] },
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

const watched = [
	'index.html',
	'sources/**',
	'../app/GNUmakefile*',
	'../app/sources/*.c',
	'../app/sources/*.h',
	'../app/libraries/*.c',
	'../app/libraries/*.h',
];

let rebuilding = false;
async function rebuild() {
	if (rebuilding)
		return;
	rebuilding = true;

	console.clear();

	const command = options.watch.split(' ')[0];
	const parameters = options.watch.split(' ').slice(1);
	spawnSync(command, parameters, { stdio: 'inherit' });

	await context.rebuild();

	console.log('\nBuild finished, serving on http://localhost:8000/...');

	rebuilding = false;
}

chokidar.watch(watched, { ignoreInitial: true })
	.once('ready', rebuild)
	.on('all', rebuild);

context.serve({ servedir: 'build' });
