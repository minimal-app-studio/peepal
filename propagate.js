
const http = require('http');
const https = require('https');
const context = require('./async-context.js');
const { config } = require('process');

const originals = {
    http: {
        createServer: http.createServer,
        request: http.request,
        get: http.get,
    },
    https: {
        createServer: https.createServer,
        request: https.request,
        get: https.get,
    },
};


function inject(options, config) {
    options.headers[config.headerToPropagate] = context.getStore().get(config.headerToPropagate);
}

function injectInResponse(response, config) {
                response.setHeader(config.headerToPropagate, context.getStore().get(config.headerToPropagate));
}

function wrapRequest(originalMethod, config) {
    function urlFirst(url, options, cb) {
        inject(options, config);

        return originalMethod(url, options, cb);
    }

    function optionsFirst(options, cb) {
        inject(options, config);

        return originalMethod(options, cb);
    }

    return function _wrappedHttpRequest(first, ...rest) {
        if (typeof first === 'string') {
            const [second] = rest;

            if (typeof second === 'function') {
                return urlFirst(first, {}, ...rest);
            }

            return urlFirst(first, ...rest);
        }

        return optionsFirst(first, ...rest);
    };
}

function wrappedListener(config, listener) {
    return (req, res, next) => {
        if (config.propagateInResponses) {
            injectInResponse(res, config);
        }
        listener(req, res, next);
    };
}

function wrapCreateServer(key, config) {
    return function _wrappedCreateServer(...args) {
        if (args.length === 1) {
            return originals[key].createServer(wrappedListener(config, args[0]));
        }

        return originals[key].createServer(args[0], wrappedListener(config, args[1]));
    };
}

module.exports.wrapModule = function (key, httpModule, config) {
    httpModule.createServer__original = originals[key].createServer;
    httpModule.createServer = wrapCreateServer(key, config);
    httpModule.request__original = originals[key].request;
    httpModule.request = wrapRequest(originals[key].request, config);
    httpModule.get__original = originals[key].get;
    httpModule.get = wrapRequest(originals[key].get, config);
}

