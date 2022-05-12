import { readFileSync, writeFileSync } from 'fs';

import nodeResolve from '@rollup/plugin-node-resolve'
import babel from '@rollup/plugin-babel'
import replace from '@rollup/plugin-replace'
import url from '@rollup/plugin-url'
import commonjs from '@rollup/plugin-commonjs'
import styles from "rollup-plugin-styles"
import { terser } from 'rollup-plugin-terser'

const build = process.env.BUILD || 'development';
const isProduction = build == 'production';

function html(input) {
    return {
      name: 'html',
      writeBundle(options, bundle) {
        let code = bundle[Object.keys(bundle)[0]].code;
        code = 'data:text/javascript;base64,' + Buffer.from(code).toString('base64');

        let template = readFileSync(input, 'utf-8');
        template = template.replace('</body>', '<script src="' + code + '"></script></body>');

        writeFileSync(options.file, template);
      }
    };
  }

export default {
    input: 'src/index.jsx',
    output: {
        file: 'index.html',
        format: 'es'
    },
    inlineDynamicImports: true,
    preserveEntrySignatures: false,
    plugins: [
        nodeResolve({
            extensions: [".js"],
        }),
        replace({
            preventAssignment: true,
            'process.env.NODE_ENV': JSON.stringify(build)
        }),
        styles(),
        url({ limit: 32 * 1024 }),
        commonjs(),
        babel({
            compact: true,
            babelHelpers: 'bundled',
            presets: [["@babel/preset-react", { runtime: 'automatic' }]],
        }),
        isProduction && terser(),
        html('res/index.html'),
    ]
};