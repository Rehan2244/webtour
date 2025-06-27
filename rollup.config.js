import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/guided-tour.js',
  output: [
    {
      file: 'dist/guided-tour.js',
      format: 'umd',
      name: 'GuidedTour'
    },
    {
      file: 'dist/guided-tour.min.js',
      format: 'umd',
      name: 'GuidedTour',
      plugins: [terser()]
    }
  ],
  plugins: [resolve()]
};