const { Post } = require('../models');

module.exports = {
    async popular() {
        const posts = await Post.aggregate([
            {
                "$project": {
                    "title": 1,
                    "where": 1,
                    "likes": 1,
                    "saved_by": 1,
                    // Use $ifNull to ensure saved_by is always an array, even if it's missing
                    "saved_by_length": { "$size": { "$ifNull": ["$saved_by", []] } },
                    "length": { "$size": "$likes" }
                }
            },
            { "$sort": { "length": -1 } },
            { "$limit": 5 }
        ]);

        return posts;
    }
};
