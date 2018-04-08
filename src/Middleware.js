import { getOption } from './helpers';
import { GetProcess } from './Creators';

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
        const req = process.request(action.config);

        const requestStructure = {
            url   : `${baseURL}${req.url}`,
            method: process.method,
            data  : req.payload,
        };

        // send the request action down the pipe
        next({ ...action, type: process.types.init });

        return request(requestStructure)
            .then((res) => {
                const response = {
                    succeeded: true,
                    data     : res.data,
                    status   : res.status,
                    request  : requestStructure
                };

                const processedResponse = process.success(response);
                next({ type: process.types.success, response: processedResponse });
                return { ...processedResponse };
            })
            .catch((ermahgerd) => {
                const response = {
                    succeeded: false,
                    data     : ermahgerd.response.data,
                    status   : ermahgerd.response.status,
                    request  : requestStructure
                };

                const processedError = process.error(response);
                next({ type: process.types.error, ...processedError });
                return { ...processedError };
            });
    }
};

export default ProcessMiddleware;
