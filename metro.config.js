// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('cjs');
config.resolver.unstable_enablePackageExports = false;
const ALIASES = {
  'react-native-maps': 'react-native-web-maps',
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    return context.resolveRequest(context, ALIASES[moduleName] ?? moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
