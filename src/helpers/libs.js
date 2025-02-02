const helpers = {};

helpers.randomString = (n) => {
    const possible = 'abcdefghilmnopqrstxwyk0123456789';
    let randomString = 0;
    for (let i = 0; i<n; i++) {
        randomString += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return randomString;
};

helpers.generateUniqueImageUrl = (existingFilenames) => {
    let newImageUrl;
    const generate = () => {
        newImageUrl = helpers.randomString(6);
        if (existingFilenames.includes(newImageUrl)) {
            return generate(); // Recursively generate a new string if there’s a duplicate
        }
        return newImageUrl;
    };
    return generate();
};

helpers.escapeRegex = (text) => {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

helpers.getPageRange = (pages, currentPage, pagesPerSet = 10) => {
    let count = [];

    if (currentPage <= pagesPerSet) {
        // If the current page is within the first 10 pages
        count = Array.from({ length: Math.min(pages, pagesPerSet) }, (_, i) => i + 1);
    } else {
        // Calculate the start and end pages for currentPage > pagesPerSet
        const startPage = Math.max(currentPage - pagesPerSet + 1, 1);
        const endPage = Math.min(startPage + pagesPerSet - 1, pages);

        count = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
    }

    return count;
};

module.exports = helpers;