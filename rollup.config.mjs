import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

export default {
    input: 'src/index.ts',
    output: [
        {
            file: 'dist/index.js',
            format: 'umd',
            name: 'puUtils',
            sourcemap: false,
            globals: {
                'crypto-js': 'CryptoJS'
            }
        },
        {
            file: 'dist/index.esm.js',
            format: 'es',
            sourcemap: false
        }
    ],
    external: ['crypto-js'],
    plugins: [
        nodeResolve(),
        commonjs(),
        typescript({
            tsconfig: './tsconfig.json',
            declaration: true,
            declarationDir: './dist/types',
            rootDir: './src'
        }),
        terser({
            format: {
                comments: false
            },
            compress: {
                drop_console: true,
                drop_debugger: true,
                pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn']
            }
        })
    ]
};
