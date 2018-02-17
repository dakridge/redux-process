import axios from 'axios';

// helpers
const { hasOwnProperty } = Object.prototype;

// closure
const StoredProcesses = {};

const createDispatch = (processName, config) => ({
    type: '@@process/RUN_PROCESS',
    config,
    name: processName,
});

const GetProcess = (processName) => {
    if (hasOwnProperty.call(StoredProcesses, processName)) {
        return StoredProcesses[processName];
    }

    return null;
};

const GenerateProcess = (processName, config) => {
    /*
        Runs a process from the config file
    */

    if (hasOwnProperty.call(StoredProcesses, processName)) {
        return createDispatch(processName, config);
    }

    return null;
};

const CreateProcess = (config) => {
    /*
        Creates a new process from a config file
    */

    const processName = config.name;

    if (hasOwnProperty.call(StoredProcesses, processName)) {
        //
    }

    StoredProcesses[processName] = {};
    StoredProcesses[processName].name = config.name;
    StoredProcesses[processName].method = config.method;
    StoredProcesses[processName].request = config.request;
    StoredProcesses[processName].receive = config.receive;
    StoredProcesses[processName].ermahgerd = config.ermahgerd;

    StoredProcesses[processName].types = {};
    StoredProcesses[processName].types.base = config.type;
    StoredProcesses[processName].types.init = `${config.type}@START`;
    StoredProcesses[processName].types.success = `${config.type}@SUCCESS`;
    StoredProcesses[processName].types.error = `${config.type}@ERROR`;

    return {
        processName,
        __IsReduxProcess: true,
    };
};

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

export { CreateProcess, GenerateProcess, ProcessMiddleware };
