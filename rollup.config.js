/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
import babel from 'rollup-plugin-babel';

export default {
  entry: 'src/plugin.js',
  plugins: [
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
