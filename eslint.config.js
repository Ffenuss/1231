// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
    rules: {
      // PanResponder gestures and Three.js scenes intentionally keep mutable refs;
      // the React Compiler rules flag these patterns as false positives.
      'react-hooks/refs': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
    },
  },
  {
    // Node-side helper scripts (multiplayer relay, rules simulation).
    files: ['scripts/**/*.js'],
    languageOptions: {
      globals: { Buffer: 'readonly', process: 'readonly', require: 'readonly', module: 'writable', __dirname: 'readonly' },
    },
    rules: { 'no-undef': 'off' },
  },
]);
