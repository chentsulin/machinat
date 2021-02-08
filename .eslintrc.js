module.exports = {
  parser: '@typescript-eslint/parser',
  env: {
    jest: true,
  },
  globals: {
    __DEV__: false,
  },
  plugins: ['prettier', '@typescript-eslint'],
  extends: [
    'airbnb-base',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:prettier/recommended',
    'prettier/react',
    'prettier/standard',
    'prettier/@typescript-eslint',
    'plugin:import/typescript',
  ],
  rules: {
    strict: 'off',
    'no-bitwise': 'off',
    'no-shadow': 'off',
    'no-nested-ternary': 'off',
    'no-underscore-dangle': 'off',
    'no-cond-assign': 'off',
    'no-unused-expressions': 'off',
    'no-use-before-define': 'off',
    'no-param-reassign': [
      'error',
      {
        props: true,
        ignorePropertyModificationsFor: ['res'],
      },
    ],
    'no-restricted-syntax': [
      'error',
      'ForInStatement',
      'LabeledStatement',
      'WithStatement',
    ],
    'lines-between-class-members': [
      'error',
      'always',
      { exceptAfterSingleLine: true },
    ],
    'max-classes-per-file': 'off',
    'import/extensions': 'off',
    'import/no-unresolved': [
      'error',
      {
        ignore: ['@machinat/.*'],
      },
    ],
    'import/no-extraneous-dependencies': [
      'error',
      {
        optionalDependencies: true,
      },
    ],
    'import/no-cycle': 'off',
    'import/no-named-as-default': 'off',
    'react/jsx-key': 'off',
    'react/display-name': 'off',
    'react/prop-types': 'off',
    'react/no-unescaped-entities': [
      'error',
      {
        forbid: ['<', '>', '{', '}'],
      },
    ],
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-shadow': ['error'],
    '@typescript-eslint/no-use-before-define': ['error'],
    '@typescript-eslint/no-namespace': [
      'error',
      {
        allowDeclarations: true,
      },
    ],
    '@typescript-eslint/ban-types': [
      'error',
      {
        types: {
          '{}': false,
        },
      },
    ],
  },
  overrides: [
    {
      files: '**/__{tests,fixtures,mocks}__/*',
      rules: {
        'import/no-extraneous-dependencies': 'off',
      },
    },
  ],
  settings: {
    react: {
      pragma: 'Machinat',
    },
  },
};
