// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'functions/lib/*'],
  },
  {
    // React Compiler rules introduced with eslint-config-expo 58. Existing screens predate
    // them; keep them visible as warnings until those components are refactored.
    rules: {
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/use-memo': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/immutability': 'warn',
      // TypeScript already checks namespace members, and this rule can't follow `export *`.
      'import/namespace': 'off',
    },
  },
]);
