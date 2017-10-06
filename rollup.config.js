import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import builtins from 'rollup-plugin-node-builtins';
import globals from 'rollup-plugin-node-globals';
import commonjs from 'rollup-plugin-commonjs';
import glslify from 'rollup-plugin-glslify';
import pkg from './package.json';

export default {
  name: 'quickvoxel',
  input: 'main.js',
  output: {
    file:  pkg.main,
    format: 'umd',
    sourcemap: 'inline',
    moduleName: 'QuickVoxel',
  },
  plugins: [
    glslify(),
    resolve({ jsnext: true }),
    commonjs({ include: ['node_modules/**'] }),
    globals(),
    builtins(),
    babel({
      babelrc: false,
      exclude: ['node_modules/**'],
      presets: [ 'es2015-rollup' ]
    })
  ]
}
