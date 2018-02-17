import axios from 'axios';

var defaults = {
    error: function error(err) {
        return err.data;
    }
};

// defaults

// helpers
var hasOwnProperty = Object.prototype.hasOwnProperty;

// closure

var StoredProcesses = {};

var createDispatch = function createDispatch(processName, config) {
    return {
        type: '@@process/RUN_PROCESS',
        config: config,
        name: processName
    };
};

var GetProcess = function GetProcess(processName) {
    if (hasOwnProperty.call(StoredProcesses, processName)) {
        return StoredProcesses[processName];
    }

    return null;
};

var GenerateProcess = function GenerateProcess(processName, config) {
    /*
        Runs a process from the config file
    */

    if (hasOwnProperty.call(StoredProcesses, processName)) {
        return createDispatch(processName, config);
    }

    console.warn('Process: \'' + processName + '\' does not exist.');

    return { type: '@@process/PROCESS_DNE', processName: processName };
};

var CreateProcess = function CreateProcess(config) {
    /*
        Creates a new process from a config file
    */

    var processName = config.name;

    var build = function build() {
        if (hasOwnProperty.call(StoredProcesses, processName)) {
            return false; // process already exists
        }

        StoredProcesses[processName] = {};
        StoredProcesses[processName].name = config.name;
        StoredProcesses[processName].method = config.method;
        StoredProcesses[processName].request = config.request;
        StoredProcesses[processName].receive = config.receive;
        StoredProcesses[processName].ermahgerd = config.ermahgerd || defaults.error;

        StoredProcesses[processName].types = {};
        StoredProcesses[processName].types.base = config.type;
        StoredProcesses[processName].types.init = config.type + '@START';
        StoredProcesses[processName].types.error = config.type + '@ERROR';
        StoredProcesses[processName].types.success = config.type + '@SUCCESS';

        return {
            processName: processName,
            __IsReduxProcess: true
        };
    };

    return build;
};

var _extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};

var ProcessMiddleware = function ProcessMiddleware(processes) {
    return function (store) {
        return function (next) {
            return function (action) {
                var type = action.type;

                // build the processes

                processes.forEach(function (build) {
                    build();
                });

                if (type !== '@@process/RUN_PROCESS') {
                    return next(action);
                }

                // run our process down here
                var process = GetProcess(action.name);
                var req = process.request(action.config);

                var requestStructure = {
                    url: req.url,
                    method: process.method,
                    data: req.payload
                };

                // send the request action down the pipe
                next(_extends({}, action, { type: process.types.init }));

                return axios(requestStructure).then(function (res) {
                    var response = {
                        succeeded: true,
                        data: res.data,
                        status: res.status
                    };

                    var processedResponse = process.receive(response);
                    next({ type: process.types.success, response: processedResponse });
                    return { succeeded: true, status: response.status, data: processedResponse };
                }).catch(function (ermahgerd) {
                    var response = {
                        succeeded: false,
                        data: ermahgerd.response.data,
                        status: ermahgerd.response.status
                    };

                    var processedError = process.ermahgerd(response);
                    next({ type: process.types.error, response: processedError });
                    return { succeeded: false, error: ermahgerd, data: processedError };
                });
            };
        };
    };
};

export { CreateProcess, GenerateProcess, ProcessMiddleware };
