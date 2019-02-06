import { GetProcess } from './Creators';
import { getOption, getNested } from './helpers';

const ProcessMiddleware = (processes, request, options) => {

    const logging = getOption(options, 'logging');
    const baseURL = getOption(options, 'baseURL');
    const defaultError = getOption(options, 'error');
    const defaultSuccess = getOption(options, 'success');

    // build the processes
    if ( logging >= 1 ) {
        console.group('Build Processes');
    }

    processes.forEach((process) => {
        process.build({
            error  : defaultError,
            success: defaultSuccess,
        });

        if ( logging >= 1 ) {
            console.log( `Building: ${process.name}` );
        }
    });

    if ( logging >= 1 ) {
        console.groupEnd();
    }

    return store => next => (action) => {
        const { type } = action;

        if (type !== '@@process/RUN_PROCESS') {
            return next(action);
        }

        // run our process down here
        const process = GetProcess(action.name);
        const req = process.request(action.config, store);

        const requestStructure = {
            data  : req.payload,
            props : action.config,
            method: process.method,
            url   : req.cancelBaseUrl ? `${req.url}` : `${baseURL}${req.url}`,
        };

        // send the request action down the pipe
        next({ ...action, type: process.types.init });

        return request(process, action)(requestStructure)
            .then((res) => {
                const response = {
                    succeeded: true,
                    data     : res.data,
                    status   : res.status,
                    request  : requestStructure
                };

                const processedResponse = process.success(response);
                
                const actionPayload = {
                    succeeded: true, 
                    status   : res.status, 
                    request  : requestStructure, 
                    response : processedResponse,
                    type     : process.types.success,
                };
                
                next(actionPayload);
                return actionPayload;
            })
            .catch((ermahgerd) => {
                const response = {
                    succeeded    : false,
                    data         : getNested(ermahgerd, ['response', 'data'], {}),
                    status       : getNested(ermahgerd, ['response', 'status'], 400),
                    request      : requestStructure,
                    originalError: ermahgerd,
                };

                const processedError = process.error(response);

                const actionPayload = {
                    succeeded: false, 
                    response : processedError,
                    status   : response.status, 
                    request  : requestStructure, 
                    type     : process.types.error,
                };

                next(actionPayload);
                return actionPayload;
            });
    }
};

export default ProcessMiddleware;
