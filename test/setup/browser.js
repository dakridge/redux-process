import { JSDOM } from 'jsdom';

const jsdom = new JSDOM('<!doctype html><html><body></body></html>');
const { window } = jsdom;

function copyProps(src, target) {
    const props = Object.getOwnPropertyNames(src)
        .filter(prop => typeof target[prop] === 'undefined')
        .reduce((result, prop) => ({
            ...result,
            [prop]: Object.getOwnPropertyDescriptor(src, prop),
        }), {});
    Object.defineProperties(target, props);
}

// remove the 'requestAnimationFrame' error message
global.requestAnimationFrame = cb => setTimeout(cb, 0);

global.window = window;
global.document = window.document;
global.navigator = {
    userAgent: 'node.js',
};

copyProps(window, global);