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

var getLifecycleLabel = function getLifecycleLabel(name) {
    var lifecycles = {
        start: 'START',
        fail: 'FAIL',
        success: 'SUCCESS'
    };

    return lifecycles[name];
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

var objectWithoutProperties = function (obj, keys) {
  var target = {};

  for (var i in obj) {
    if (keys.indexOf(i) >= 0) continue;
    if (!Object.prototype.hasOwnProperty.call(obj, i)) continue;
    target[i] = obj[i];
  }

  return target;
};

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

    var build = function build(defaults$$1) {
        if (hasOwnProperty.call(StoredProcesses, processName)) {
            return false; // process already exists
        }

        var name = config.name,
            type = config.type,
            error = config.error,
            method = config.method,
            request = config.request,
            success = config.success,
            requiredProps = config.requiredProps,
            otherProps = objectWithoutProperties(config, ['name', 'type', 'error', 'method', 'request', 'success', 'requiredProps']);


        StoredProcesses[processName] = _extends({}, otherProps);
        StoredProcesses[processName].name = name;
        StoredProcesses[processName].method = method;
        StoredProcesses[processName].request = request;
        StoredProcesses[processName].requiredProps = requiredProps || [];
        StoredProcesses[processName].success = success || defaults$$1.success;
        StoredProcesses[processName].error = error || defaults$$1.error;

        StoredProcesses[processName].types = {};
        StoredProcesses[processName].types.base = type;
        StoredProcesses[processName].types.init = type + '@' + getLifecycleLabel('start');
        StoredProcesses[processName].types.error = type + '@' + getLifecycleLabel('fail');
        StoredProcesses[processName].types.success = type + '@' + getLifecycleLabel('success');

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
                var req = process.request(action.config, store);

                var requestStructure = {
                    data: req.payload,
                    props: action.config,
                    method: process.method,
                    url: req.cancelBaseUrl ? '' + req.url : '' + baseURL + req.url
                };

                var processConfig = action.config ? action.config : {};

                var typeLabels = {
                    init: processConfig.processTypeLabel ? processConfig.processTypeLabel + '@' + getLifecycleLabel('start') : process.types.init,
                    error: processConfig.processTypeLabel ? processConfig.processTypeLabel + '@' + getLifecycleLabel('fail') : process.types.error,
                    success: processConfig.processTypeLabel ? processConfig.processTypeLabel + '@' + getLifecycleLabel('success') : process.types.success
                };

                // send the request action down the pipe
                next(_extends({}, action, { type: typeLabels.init }));

                return request(process, action)(requestStructure).then(function (res) {
                    var response = {
                        succeeded: true,
                        data: res.data,
                        status: res.status,
                        request: requestStructure
                    };

                    var processedResponse = process.success(response);

                    var actionPayload = {
                        succeeded: true,
                        status: res.status,
                        request: requestStructure,
                        response: processedResponse,
                        type: typeLabels.success
                    };

                    next(actionPayload);
                    return actionPayload;
                }).catch(function (ermahgerd) {
                    var response = {
                        succeeded: false,
                        data: getNested(ermahgerd, ['response', 'data'], {}),
                        status: getNested(ermahgerd, ['response', 'status'], 400),
                        request: requestStructure,
                        originalError: ermahgerd
                    };

                    var processedError = process.error(response);

                    var actionPayload = {
                        succeeded: false,
                        response: processedError,
                        status: response.status,
                        request: requestStructure,
                        type: typeLabels.error
                    };

                    next(actionPayload);
                    return actionPayload;
                });
            };
        };
    };
};

export { CreateProcess, GenerateProcess, ProcessMiddleware };
