/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
import babel from 'rollup-plugin-babel';
import nodeResolve from 'rollup-plugin-node-resolve';

export default {
  entry: 'src/plugin.js',
  external: [
    'http-status-codes',
    'milliseconds',
    'highwire',
    'delay',
    'joi',
    'hoek',
    'boom'
  ],
  plugins: [
    nodeResolve({
      module: true,
      jsnext: true
    }),
    babel({
      babelrc: false,
      exclude: ['./node_modules/**'],
      presets: ['es2015-rollup']
    })
  ],
  targets: [
    {dest: 'lib/plugin.cjs.js', format: 'cjs'},
    {dest: 'lib/plugin.es.js', format: 'es'}
  ]
};
