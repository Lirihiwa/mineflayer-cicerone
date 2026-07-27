const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2023,
            sourceType: 'commonjs',
            globals: {
                ...globals.node,
            },
        },
        rules: {
            quotes: ['error', 'single', { avoidEscape: true }],
            semi: ['error', 'always'],
            indent: ['error', 4],
            'comma-dangle': ['error', 'always-multiline'],
            'no-trailing-spaces': 'error',
            'no-multi-spaces': 'error',
            'eol-last': ['error', 'always'],
            'no-unused-vars': ['warn', { args: 'none' }],
        },
    },
    {
        ignores: ['node_modules/**', '.idea/**'],
    },
];
