const pino = require('pino');
const uuid = require('uuid');
const wrapModule = require("./propagate");

const http = require('http');
const https = require('https');
const context = require('./async-context.js');

let pinoLogger = null;
let traceHeader = null;
let peepal = null;

module.exports.peepal = function (options = {}) {
  const pinoOptions = {
    level: options.level || "trace"
  }
  traceHeader = options.traceHeader || 'x-peepal-trace-id';
  pinoLogger = pino(pinoOptions);
  peepal = new Proxy(pinoLogger, {
    get(target, property, receiver) {
      if (property === 'child') {
        return (...args) => {
          const childLogger = Reflect.apply(target[property], target, args);
          return new Proxy(childLogger, {
            get(childTarget, childProperty, childReceiver) {
              childTarget = context.getStore()?.get('logger') || childTarget;
              return Reflect.get(childTarget, childProperty, childReceiver);
            },
          });
        };
      }

      target = context.getStore()?.get('logger') || target;
      return Reflect.get(target, property, receiver);
    },
  });
  return peepal;
};

module.exports.child = function (options) {
  if (!pinoLogger) throw new Error("please instantiate peepal logger before registering middlewares");
  return peepal.child(options);
}

module.exports.contextMiddleware = (req, res, next) => {
  if (!pinoLogger || !traceHeader) throw new Error("please instantiate peepal logger before registering middlewares");
  const traceId = req.headers[traceHeader] || uuid.v4();
  const child = pinoLogger.child({ traceId });
  const store = new Map();
  store.set('logger', child);
  store.set(traceHeader, traceId);
  return context.run(store, next);
};

wrapModule('https', https, {
  headersToPropagate: [traceHeader]
});

wrapModule('http', http, {
  headersToPropagate: [traceHeader]
});

