//controlador: objeto con funciones
const ctrl = {};

const { Post } = require('../models');
const sidebar = require('../helpers/sidebar');

ctrl.find_count = async (req, res) => {
    let show_counting = false
    const prefecture = req.params.prefecture;
    const about_posts = {};
    about_posts[prefecture] = {};


    try {
        show_counting = true;
        // Fetch posts from MongoDB
        const posts = await Post.find({ "where.prefecture": { $regex: new RegExp(`^${prefecture}$`, 'i') } })
        .sort({ timestamp: 1 })
        .lean();
        
        // Process each post to populate about_posts
        for (const post of posts) {
            const _id = post._id.toString();
            const category = post.about.category;
            const title = post.title;
            const image = post.filenames.length > 0 ? post.filenames[0] : "";

            if (!about_posts[prefecture][category]) {
                // First post in this category
                about_posts[prefecture][category] = { num: 0, title: "", image: "" };
            }

            // Increment count
            about_posts[prefecture][category].num++;

            // Update title/image to latest post
            about_posts[prefecture][category]._id = _id;
            about_posts[prefecture][category].title = title;
            about_posts[prefecture][category].image = image;
            }
            
    
        console.dir(about_posts, { depth: null });
        res.render('index', { about_posts, show_counting, layout: 'landing.hbs' });
    } catch (err) {
        console.error("Error fetching posts:", err);
        // Handle error
        res.status(500).send("Error fetching posts");
    }

}

module.exports = ctrl;