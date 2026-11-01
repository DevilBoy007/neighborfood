// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('cjs');

// Native-only modules that should resolve to empty on web
const NATIVE_ONLY = [
  '@stripe/stripe-react-native',
  'react-native-maps',
  'react-native-purchases',
  'react-native-purchases-ui',
];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    if (NATIVE_ONLY.some((pkg) => moduleName === pkg || moduleName.startsWith(pkg + '/'))) {
      return { type: 'empty' };
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
