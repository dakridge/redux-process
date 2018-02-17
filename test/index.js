import server from './server';

// components
import {
    CreateProcess,
    ProcessMiddleware
} from '../src';

describe('redux-process middleware', () => {

    // start the server
    server.listen(8000);

    export const FakeProcess = CreateProcess({
        method: 'GET',
        name  : 'FakeProcess',
        type  : 'DO_FAKE_PROCESS',
    
        request: props => ({
            url    : '/tokens/generate/',
            payload: props.payload,
        })
    });    

    it('sends requests', () => {

        const next = (action) => {
            console.log( 'next....', action );
        };

        const middleware = ProcessMiddleware([ FakeProcess ]);

        console.log( middleware );

        // const action = {
        //     type: '@@process/RUN_PROCESS'
        // };

        // console.log( 'asdfsadfasdf' );
        // console.log( ProcessMiddleware('processes')('store')("next").toString() );

        // ProcessMiddleware('processes')('store')(next)(action);
    });

    // close the server
    server.close();

});