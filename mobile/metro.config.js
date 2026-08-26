const http = require('http');
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const apiPrefixes = ['/voice', '/days', '/me', '/health'];
const previousEnhance = config.server?.enhanceMiddleware;

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware, server) => {
    const inner = previousEnhance ? previousEnhance(middleware, server) : middleware;
    return (req, res, next) => {
      const pathname = (req.url ?? '').split('?')[0];
      const isApi = apiPrefixes.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
      );
      if (!isApi) {
        return inner(req, res, next);
      }

      const headers = { ...req.headers, host: '127.0.0.1:5217' };
      const upstream = http.request(
        {
          hostname: '127.0.0.1',
          port: 5217,
          path: req.url,
          method: req.method,
          headers,
        },
        (up) => {
          res.writeHead(up.statusCode ?? 502, up.headers);
          up.pipe(res);
        },
      );
      upstream.on('error', () => {
        if (!res.headersSent) {
          res.writeHead(502, { 'content-type': 'text/plain' });
        }
        res.end('local-api-down');
      });
      req.pipe(upstream);
    };
  },
};

config.resolver.unstable_enablePackageExports = true;

const rtkQueryReact = path.resolve(
  __dirname,
  'node_modules/@reduxjs/toolkit/dist/query/react/rtk-query-react.legacy-esm.js',
);

const defaultResolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@reduxjs/toolkit/query/react') {
    return { filePath: rtkQueryReact, type: 'sourceFile' };
  }

  if (defaultResolve) {
    return defaultResolve(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
