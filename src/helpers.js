export const getNested = (obj, keyPath, notSetValue = undefined) => {
    const value = keyPath.reduce((xs, x) => ((xs && xs[x]) ? xs[x] : notSetValue), obj);
    return value;
};

const defaultOptions = {
    logging: 0,
    baseURL: '',
    error  : err => err,
    success: res => res,
}

export const getOption = (options = {}, key) => {
    return getNested(options, [key], defaultOptions[key]);
}

export const getLifecycleLabel = (name) => {
    const lifecycles = {
        start  : 'START',
        fail   : 'FAIL',
        success: 'SUCCESS',
    };

    return lifecycles[name];
}