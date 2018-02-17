import babel from 'rollup-plugin-babel';
import async from 'rollup-plugin-async';

export default {
    input   : 'src/index.js',
    output  : [
        { name: 'redux-process', format: 'es', file: 'dist/bundle.es.js' },
        { name: 'redux-process', format: 'umd', file: 'dist/bundle.umd.js' },
    ],
    plugins: [
        async(),
        babel({
            exclude: 'node_modules/**',
        })
    ],
    external : ['axios']
}