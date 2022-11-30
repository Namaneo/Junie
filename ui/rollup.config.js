import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import glob from "glob";

import nodeResolve from '@rollup/plugin-node-resolve'
import babel from '@rollup/plugin-babel'
import replace from '@rollup/plugin-replace'
import url from '@rollup/plugin-url'
import commonjs from '@rollup/plugin-commonjs'
import styles from "rollup-plugin-styles"
import { terser } from 'rollup-plugin-terser'

const build = process.env.BUILD || 'development';
const isProduction = build == 'production';

function watcher(globs) {
    return {
        buildStart() {
            for (const item of globs) {
                const files = glob.sync(path.resolve(__dirname, item));

                for (let file of files)
                    this.addWatchFile(file)
            }
        },
    }
};

function html(input) {
    return {
        name: 'html',
        writeBundle(options, bundle) {
        let code = bundle[Object.keys(bundle)[0]].code;
        code = Buffer.from(code).toString('base64');

        let template = readFileSync(input, 'utf-8');
        template = template.replace(
            'const source = null;',
            'const source = "' + code + '";'
        );

        writeFileSync(options.file, template);
        }
    };
}

export default {
    input: 'src/index.jsx',
    output: {
        file: 'build/index.html',
        format: 'es'
    },
    inlineDynamicImports: true,
    preserveEntrySignatures: false,
    plugins: [
        watcher([
            'index.html',
            'src/**',
            'res/**',
            '../app/GNUmakefile*',
            '../app/src/*.c',
            '../app/src/*.h',
            '../app/res/**',
            '../app/web/**'
        ]),
        nodeResolve({
            rootDir: path.join(process.cwd(), 'src'),
            extensions: [".js", ".jsx"],
        }),
        replace({
            preventAssignment: true,
            'process.env.NODE_ENV': JSON.stringify(build)
        }),
        styles(),
        url({ limit: 256 * 1024 }),
        commonjs(),
        babel({
            compact: true,
            babelHelpers: 'bundled',
            presets: [["@babel/preset-react", { runtime: 'automatic' }]],
        }),
        isProduction && terser(),
        html('index.html'),
    ]
};
