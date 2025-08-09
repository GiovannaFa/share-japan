const moment = require('moment');
const mongoose = require('mongoose');

const helpers= {};

helpers.timeago = timestamp => {
    return moment(timestamp).startOf('minutes').fromNow();
};

helpers.UpperCase = value => {
    return value.toUpperCase();
};

helpers.Capitalize = value => {
    return String(value).charAt(0).toUpperCase() + String(value).slice(1);
};

helpers.gt = function(value, num, options) {
    if (value > num) {
        return options.fn(this);
    }
    return options.inverse(this);
};

helpers.ge = function(value, num, options) {
    if (value >= num) {
        return options.fn(this);
    }
    return options.inverse(this);
};

helpers.lt = function(value, num, options) {
    if (value < num) {
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

helpers.ifLengthDictGreaterThan = function (value, length, options) {
    const hasData = Object.values(value).some(
        // For each prefecture object
        (categories) => Object.keys(categories).length > length
    );

    if (hasData) {
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


helpers.isCurrent = function(page, currentPage, options) {
    if (page === currentPage) {
        return options.fn(this); // Render the content in the {{#if}} block
    }
    return options.inverse(this); // Render the content in the {{else}} block
};

helpers.add = function(a, b) {
    return a + b;
};

helpers.substract = function(a, b) {
    return a - b;
};

helpers.compareObjectId = function(value, stringId, options) {
    // Convert stringId to ObjectId (if it's a valid ObjectId string)
    const objectId = mongoose.Types.ObjectId(stringId);

    // Compare the ObjectId and return HTML or content depending on the result
    if (value.equals(objectId)) {
        return options.fn(this);  // Render the block inside {{#compareObjectId}} if true
    } else {
        return options.inverse(this);  // Render the block inside {{else}} if false
    }
};

module.exports = helpers;