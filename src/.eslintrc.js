module.exports = {
    root: true,
    extends: ['scratch', 'scratch/es6', 'eslint:recommended',  'plugin:react/recommended'],
    env: {
        browser: true
    },
    rules: {
        'linebreak-style': 0,
        'indent': 0,
        'no-undefined': 1,
        // "no-unused-vars": [2, {"vars": "local", "varsIgnorePattern": "[iI]gnored"}],
        'max-len' : ["error", { "code": 10000 }]
    } 
};
