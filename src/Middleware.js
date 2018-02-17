import axios from 'axios';
import { GetProcess } from './Creators';

const ProcessMiddleware = processes => store => next => async (action) => {
    const { type } = action;

    // build the processes
    processes.forEach((build) => {
        build();
    });

    if (type !== '@@process/RUN_PROCESS') {
        return next(action);
    }

    // run our process down here
    const process = GetProcess(action.name);
    const req = process.request(action.config);

    const requestStructure = {
        url   : req.url,
        method: process.method,
        data  : req.payload,
    };

    // send the request action down the pipe
    next({ ...action, type: process.types.init });

    return axios(requestStructure)
        .then((res) => {
            const response = {
                succeeded: true,
                data     : res.data,
                status   : res.status,
            };

            const processedResponse = process.receive(response);
            next({ type: process.types.success, response: processedResponse });
            return { succeeded: true, status: response.status, data: processedResponse };
        })
        .catch((ermahgerd) => {
            const response = {
                succeeded: false,
                data     : ermahgerd.response.data,
                status   : ermahgerd.response.status,
            };

            const processedError = process.ermahgerd(response);
            next({ type: process.types.error, response: processedError });
            return { succeeded: false, error: ermahgerd, data: processedError };
        });
};

export default ProcessMiddleware;
