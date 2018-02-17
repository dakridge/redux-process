import axios from 'axios';

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

    return null;
};

var CreateProcess = function CreateProcess(config) {
    /*
        Creates a new process from a config file
    */

    var processName = config.name;

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
    StoredProcesses[processName].types.init = config.type + '@START';
    StoredProcesses[processName].types.success = config.type + '@SUCCESS';
    StoredProcesses[processName].types.error = config.type + '@ERROR';

    return {
        processName: processName,
        __IsReduxProcess: true
    };
};

function __async(g) {
  return new Promise(function (s, j) {
    function c(a, x) {
      try {
        var r = g[x ? "throw" : "next"](a);
      } catch (e) {
        j(e);return;
      }r.done ? s(r.value) : Promise.resolve(r.value).then(c, d);
    }function d(e) {
      c(e, 1);
    }c();
  });
}

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
                return __async( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
                    var type, process, req, requestStructure, request, response, processedResponse, _response, _processedResponse;

                    return regeneratorRuntime.wrap(function _callee$(_context) {
                        while (1) {
                            switch (_context.prev = _context.next) {
                                case 0:
                                    type = action.type;

                                    if (!(type !== '@@process/RUN_PROCESS')) {
                                        _context.next = 3;
                                        break;
                                    }

                                    return _context.abrupt('return', next(action));

                                case 3:

                                    // run our process down here
                                    process = GetProcess(action.name);
                                    req = process.request(action.config);
                                    requestStructure = {
                                        url: req.url,
                                        method: process.method,
                                        data: req.payload
                                    };

                                    // send the request action down the pipe

                                    next(_extends({}, action, { type: process.types.init }));

                                    // perform the request
                                    _context.prev = 7;
                                    _context.next = 10;
                                    return axios(requestStructure);

                                case 10:
                                    request = _context.sent;
                                    response = {
                                        succeeded: true,
                                        status: request.status,
                                        data: request.data
                                    };
                                    processedResponse = process.receive(response);

                                    next({ type: process.types.success, response: processedResponse });
                                    return _context.abrupt('return', { succeeded: true, status: response.status, data: processedResponse });

                                case 17:
                                    _context.prev = 17;
                                    _context.t0 = _context['catch'](7);
                                    _response = {
                                        succeeded: false,
                                        error: _context.t0
                                    };
                                    _processedResponse = process.ermahgerd(_response);

                                    next({ type: process.types.error, response: _processedResponse });
                                    return _context.abrupt('return', { succeeded: false, error: _context.t0 });

                                case 23:
                                case 'end':
                                    return _context.stop();
                            }
                        }
                    }, _callee, this, [[7, 17]]);
                })());
            };
        };
    };
};

export { CreateProcess, GenerateProcess, ProcessMiddleware };
