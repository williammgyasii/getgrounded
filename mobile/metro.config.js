const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

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
