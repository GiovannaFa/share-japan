const moment = require('moment');

const helpers= {};

helpers.timeago = timestamp => {
    return moment(timestamp).startOf('minutes').fromNow();
};

helpers.UpperCase = value => {
    return value.toUpperCase();
};

helpers.gt = function(value, num, options) {
    if (value > num) {
        return options.fn(this);
    }
    return options.inverse(this);
};

helpers.ifLengthGreaterThan = function(value, length, options) {
    if (value.length > length) {
        return options.fn(this);
    }
    return options.inverse(this);
};

helpers.ifLengthDictGreaterThan = function(value, length, options) {
    if (Object.keys(value).length > length) {
        return options.fn(this);
    }
    return options.inverse(this);
};

helpers.toJson = function(object) {
    return JSON.stringify(object);
  };

helpers.ifExtensionEquals = function(filename, expectedExtension, options) {
    // Extract the file extension
    const fileExtension = filename.split('.').pop();

    // Check if the file extension matches the expected value
    if (fileExtension === expectedExtension) {
        return options.fn(this);
    }
    return options.inverse(this);
};



module.exports = helpers;