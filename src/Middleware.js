import axios from 'axios';
import { GetProcess } from './Creators';

const ProcessMiddleware = processes => store => next => async (action) => {
    const { type } = action;

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

    // perform the request
    try {
        const request = await axios(requestStructure);

        const response = {
            succeeded: true,
            status   : request.status,
            data     : request.data,
        };

        const processedResponse = process.receive(response);
        next({ type: process.types.success, response: processedResponse });
        return { succeeded: true, status: response.status, data: processedResponse };
    }
    catch (ermahgerd) {
        const response = {
            succeeded: false,
            error    : ermahgerd,
        };

        const processedResponse = process.ermahgerd(response);
        next({ type: process.types.error, response: processedResponse });
        return { succeeded: false, error: ermahgerd };
    }
};

export default ProcessMiddleware;
