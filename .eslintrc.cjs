module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['react-refresh', 'boundaries'],
  settings: {
    'boundaries/elements': [
      { type: 'core', pattern: 'src/core/*' },
      { type: 'muscu', pattern: 'src/modules/muscu/*' },
      { type: 'nutrition', pattern: 'src/modules/nutrition/*' },
      { type: 'taches', pattern: 'src/modules/taches/*' },
      { type: 'home', pattern: 'src/home/*' },
    ],
    'boundaries/ignore': ['src/main.tsx', 'src/App.tsx', 'src/test-setup.ts'],
  },
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    'boundaries/element-types': [
      'error',
      {
        default: 'disallow',
        rules: [
          { from: 'core', allow: ['core'] },
          { from: 'muscu', allow: ['core', 'muscu'] },
          { from: 'nutrition', allow: ['core', 'nutrition'] },
          { from: 'taches', allow: ['core', 'taches'] },
          // home n'importe que les index.ts publics de chaque module
          { from: 'home', allow: ['core', 'home', 'muscu', 'nutrition', 'taches'] },
        ],
      },
    ],
  },
}
