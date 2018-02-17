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

export {
    GetProcess,
    CreateProcess,
    GenerateProcess,
};
