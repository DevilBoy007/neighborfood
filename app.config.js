// Extends app.json with values that depend on the EAS build profile or environment.
const isProductionBuild = process.env.EAS_BUILD_PROFILE === 'production';
// Android renders maps with the Google provider, which needs a native API key.
const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...config.plugins.map((plugin) =>
      Array.isArray(plugin) && plugin[0] === 'expo-notifications'
        ? [plugin[0], { ...plugin[1], mode: isProductionBuild ? 'production' : 'development' }]
        : plugin
    ),
    ...(googleMapsApiKey
      ? [['react-native-maps', { androidGoogleMapsApiKey: googleMapsApiKey }]]
      : []),
  ],
});
