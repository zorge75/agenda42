import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import postcss from 'rollup-plugin-postcss';

export default {
    input: 'Shapes.tsx',
    output: [
        {
            file: 'dist/index.cjs.js',
            format: 'cjs',
            sourcemap: true,
        },
        {
            file: 'dist/index.esm.js',
            format: 'esm',
            sourcemap: true,
        },
    ],
    plugins: [
        postcss({
            modules: true,
            autoModules: true,
            extract: 'styles.css',
          }),
        resolve(),
        commonjs(),
        typescript({
            tsconfig: './tsconfig.json',
        }),
    ],
    external: ['react', 'react-dom'],
};