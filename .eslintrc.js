module.exports = {
    extends: ['scratch', 'scratch/node', 'scratch/es6'],
    rules: {
        'linebreak-style': 0,
        'indent': 0,
        'no-undefined': [0],
        'max-len' : ["error", { "code": 1000 }]
    } 
};
