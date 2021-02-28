const { Post } = require('../models');

module.exports = {
    async popular() {
        const posts = await Post.aggregate(
            [
                { "$project": {
                    "title": 1,
                    "likes": 1,
                    "length": { "$size": "$likes" }
                }},
                { "$sort": { "length": -1 } },
                { "$limit": 5 }
            ]);
        return posts;
    }
};