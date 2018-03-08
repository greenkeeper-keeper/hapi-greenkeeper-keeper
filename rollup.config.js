/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
import babel from 'rollup-plugin-babel';
import nodeResolve from 'rollup-plugin-node-resolve';

export default {
  input: 'src/plugin.js',
  external: [
    'http-status-codes',
    'highwire',
    'delay',
    'joi',
    'hoek',
    'boom',
    '@octokit/rest'
  ],
  plugins: [
    nodeResolve({
      module: true,
      jsnext: true
    }),
    babel({
      babelrc: false,
      exclude: ['./node_modules/**'],
      presets: [['env', {modules: false, targets: {node: 8}}]],
      plugins: [['transform-object-rest-spread', {useBuiltIns: true}]]
    })
  ],
  output: [
    {file: 'lib/plugin.cjs.js', format: 'cjs', sourcemap: true},
    {file: 'lib/plugin.es.js', format: 'es', sourcemap: true}
  ]
};
