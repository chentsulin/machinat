const path = require('path');

module.exports = {
  parser: 'babel-eslint',
  env: {
    jest: true,
  },
  globals: {
    __DEV__: false
  },
  plugins: [
    'json',
    'prettier',
    'flowtype',
  ],
  extends: [
    'airbnb-base',
    'plugin:react/recommended',
    'plugin:prettier/recommended',
    'prettier/flowtype',
    'prettier/react',
    'prettier/standard',
  ],
  rules: {
    strict: 0,
    'no-bitwise': 0,
    'no-nested-ternary': 0,
    'no-underscore-dangle': 0,
    'no-cond-assign': 0,
    'no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      ignoreRestSiblings: true,
    }],
    'no-cond-assign': 0,
    'no-unused-expressions': 0,
    'no-param-reassign': ['error', {
      props: true,
      ignorePropertyModificationsFor: ['context', 'ctx', 'frame', 'res'],
    }],
    'no-restricted-syntax': ['error',
      'ForInStatement', 'LabeledStatement', 'WithStatement'
    ],
    'lines-between-class-members': ['error',
      'always', { exceptAfterSingleLine: true }
    ],
    'flowtype/define-flow-type': 2,
    'flowtype/no-unused-expressions': 2,
    'import/extensions': 0,
    'import/no-unresolved': ['error', {
      ignore: ['machinat.*/types']
    }],
    'import/no-cycle': 0,
    'react/jsx-key': 0,
    'react/display-name': 0,
    'react/no-unescaped-entities': ['error', {
      forbid: ['<', '>', '{', '}']
    }],
  },
  overrides: [
    {
      files: '**/__{tests,fixtures,mocks}__/*',
      rules: {
        'import/no-extraneous-dependencies': 0
      }
    }
  ],
  settings:{
    react: {
      pragma: 'Machinat',
    },
  }
};
