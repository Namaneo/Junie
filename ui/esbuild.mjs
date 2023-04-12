
import { existsSync, readFileSync, symlinkSync, unlinkSync, writeFileSync } from 'fs';
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
				const css_path = path.join(outdir, "index.css");
				const js_path = path.join(outdir, "index.js");

				if (!existsSync(css_path) || !existsSync(js_path))
					return;

				const css = readFileSync(css_path).toString("base64");
				const js = readFileSync(js_path).toString("base64");

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

				if (existsSync(`${outdir}/games`))
					unlinkSync(`${outdir}/games`);
				if (existsSync('../games'))
					symlinkSync('../../games', `${outdir}/games`);

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
	format: 'esm',
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

const { host, port } = await context.serve({ servedir: 'build' });

const watched = [
	'index.html',
	'sources/**',
	'../cores/cores.json',
	'../app/GNUmakefile*',
	'../app/sources/*.c',
	'../app/sources/*.h',
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

	try {
		await context.rebuild();
		console.log(`\nBuild finished, serving on 'http://${host}:${port}/'...`);
	} catch (e) {
		console.error('\nBuild failed:');
		for (const error of e.errors)
			console.error(`- ${error.text} (${error.location.file}:${error.location.line})`);
	}

	rebuilding = false;
}

chokidar.watch(watched, { ignoreInitial: true })
	.once('ready', rebuild)
	.on('all', rebuild);
