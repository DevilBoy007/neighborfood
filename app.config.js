// Extends app.json with values that depend on the EAS build profile.
const isProductionBuild = process.env.EAS_BUILD_PROFILE === 'production';

module.exports = ({ config }) => ({
  ...config,
  plugins: config.plugins.map((plugin) =>
    Array.isArray(plugin) && plugin[0] === 'expo-notifications'
      ? [plugin[0], { ...plugin[1], mode: isProductionBuild ? 'production' : 'development' }]
      : plugin
  ),
});
