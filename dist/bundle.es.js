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

    var build = function build(defaults) {
        if (hasOwnProperty.call(StoredProcesses, processName)) {
            return false; // process already exists
        }

        StoredProcesses[processName] = {};
        StoredProcesses[processName].name = config.name;
        StoredProcesses[processName].method = config.method;
        StoredProcesses[processName].request = config.request;
        StoredProcesses[processName].requiredProps = config.requiredProps || [];
        StoredProcesses[processName].success = config.success || defaults.success;
        StoredProcesses[processName].error = config.error || defaults.error;

        StoredProcesses[processName].types = {};
        StoredProcesses[processName].types.base = config.type;
        StoredProcesses[processName].types.init = config.type + '@START';
        StoredProcesses[processName].types.error = config.type + '@FAIL';
        StoredProcesses[processName].types.success = config.type + '@SUCCESS';

        return {
            processName: processName,
            __IsReduxProcess: true
        };
    };

    return {
        build: build,
        name: processName
    };
};

var getNested = function getNested(obj, keyPath) {
    var notSetValue = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;

    var value = keyPath.reduce(function (xs, x) {
        return xs && xs[x] ? xs[x] : notSetValue;
    }, obj);
    return value;
};

var defaultOptions = {
    logging: 0,
    baseURL: '',
    error: function error(err) {
        return err;
    },
    success: function success(res) {
        return res;
    }
};

var getOption = function getOption() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var key = arguments[1];

    return getNested(options, [key], defaultOptions[key]);
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

var ProcessMiddleware = function ProcessMiddleware(processes, request, options) {

    var logging = getOption(options, 'logging');
    var baseURL = getOption(options, 'baseURL');
    var defaultError = getOption(options, 'error');
    var defaultSuccess = getOption(options, 'success');

    // build the processes
    if (logging >= 1) {
        console.group('Build Processes');
    }

    processes.forEach(function (process) {
        process.build({
            error: defaultError,
            success: defaultSuccess
        });

        if (logging >= 1) {
            console.log('Building: ' + process.name);
        }
    });

    if (logging >= 1) {
        console.groupEnd();
    }

    return function (store) {
        return function (next) {
            return function (action) {
                var type = action.type;


                if (type !== '@@process/RUN_PROCESS') {
                    return next(action);
                }

                // run our process down here
                var process = GetProcess(action.name);
                var req = process.request(action.config);

                var requestStructure = {
                    url: '' + baseURL + req.url,
                    method: process.method,
                    data: req.payload
                };

                // send the request action down the pipe
                next(_extends({}, action, { type: process.types.init }));

                return request(requestStructure).then(function (res) {
                    var response = {
                        succeeded: true,
                        data: res.data,
                        status: res.status,
                        request: requestStructure
                    };

                    var processedResponse = process.success(response);
                    next({ type: process.types.success, response: processedResponse });
                    return { succeeded: true, status: res.status, request: requestStructure, response: processedResponse };
                }).catch(function (ermahgerd) {
                    var response = {
                        succeeded: false,
                        data: ermahgerd.response.data,
                        status: ermahgerd.response.status,
                        request: requestStructure
                    };

                    var processedError = process.error(response);
                    next({ type: process.types.error, response: processedError });
                    return { succeeded: false, status: response.status, request: requestStructure, response: processedError };
                });
            };
        };
    };
};

export { CreateProcess, GenerateProcess, ProcessMiddleware };
