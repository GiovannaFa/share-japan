const moment = require('moment');

const helpers= {};

helpers.timeago = timestamp => {
    return moment(timestamp).startOf('minutes').fromNow();
};

helpers.UpperCase = value => {
    return value.toUpperCase();
};

module.exports = helpers;