import server from './server';

// components
import ProcessMiddleware from '../src/Middleware';

describe('redux-process middleware', () => {

    // start the server
    server.listen(8000);

    it('sends requests', () => {

        const next = (action) => {
            console.log( 'next....', action );
        };

        const action = {
            type: '@@process/RUN_PROCESS'
        };

        console.log( 'asdfsadfasdf' );
        console.log( ProcessMiddleware('processes')('store')("next").toString() );

        // ProcessMiddleware('processes')('store')(next)(action);
    });

    // close the server
    server.close();

});