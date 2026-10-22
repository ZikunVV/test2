import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    ignores: ['dist/**/*', 'node_modules/**/*', '_imported_v48_20/**/*'],
  },
  firebaseRulesPlugin.configs['flat/recommended'],
];
