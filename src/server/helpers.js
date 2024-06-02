const moment = require('moment');

const helpers= {};

helpers.timeago = timestamp => {
    return moment(timestamp).startOf('minutes').fromNow();
};

helpers.UpperCase = value => {
    return value.toUpperCase();
};

helpers.ifLengthGreaterThan = function(value, length, options) {
    if (value.length > length) {
        return options.fn(this);
    }
    return options.inverse(this);
};

module.exports = helpers;