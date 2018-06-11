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

    console.warn(`Process: '${processName}' does not exist.`);

    return { type: '@@process/PROCESS_DNE', processName };
};

const CreateProcess = (config) => {
    /*
        Creates a new process from a config file
    */

    const processName = config.name;

    const build = (defaults) => {
        if (hasOwnProperty.call(StoredProcesses, processName)) {
            return false; // process already exists
        }

        const {
            name, 
            type, 
            error, 
            method, 
            request, 
            success, 
            requiredProps,
            ...otherProps,
        } = config;

        StoredProcesses[processName] = { ...otherProps };
        StoredProcesses[processName].name = name;
        StoredProcesses[processName].method = method;
        StoredProcesses[processName].request = request;
        StoredProcesses[processName].requiredProps = requiredProps || [];
        StoredProcesses[processName].success = success || defaults.success;
        StoredProcesses[processName].error = error || defaults.error;

        StoredProcesses[processName].types = {};
        StoredProcesses[processName].types.base = type;
        StoredProcesses[processName].types.init = `${type}@START`;
        StoredProcesses[processName].types.error = `${type}@FAIL`;
        StoredProcesses[processName].types.success = `${type}@SUCCESS`;

        return {
            processName,
            __IsReduxProcess: true,
        };
    };

    return {
        build,
        name : processName
    };
};

export {
    GetProcess,
    CreateProcess,
    GenerateProcess,
};
