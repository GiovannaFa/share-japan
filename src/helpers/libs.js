const { reset } = require("nodemon");

const helpers = {};

helpers.randomString = (n) => {
    const possible = 'abcdefghilmnopqrstxwyk0123456789';
    let randomString = 0;
    for (let i = 0; i<n; i++) {
        randomString += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return randomString;
};

helpers.escapeRegex = (text) => {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = helpers;