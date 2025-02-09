//controlador: objeto con funciones
const ctrl = {};

const { Post } = require('../models');
const sidebar = require('../helpers/sidebar');

ctrl.find_count = async (req, res) => {
    let show_counting = false
    const prefecture = req.params.prefecture;
    const about_posts = {};

    try {
        show_counting = true;
        // Fetch posts from MongoDB
        const posts = await Post.find({ "where.prefecture": { $regex: new RegExp(`^${prefecture}$`, 'i') } })
        .sort({ timestamp: -1 })
        .lean();
    
        // Process each post to populate about_posts
        for (let i in posts) {
            const about = posts[i].about;
            const city = posts[i].where.city;
            const region = posts[i].where.prefecture;
    
            // Initialize the region entry if it doesn't exist
            if (!about_posts.hasOwnProperty(region)) {
                about_posts[region] = {};
            }
    
            // Initialize the city entry under the region if it doesn't exist
            if (!about_posts[region].hasOwnProperty(city)) {
                about_posts[region][city] = {};
            }
    
            // Increment the count for the specific topic in the city entry
            if (about_posts[region][city].hasOwnProperty(about)) {
                about_posts[region][city][about] += 1;
            } else {
                about_posts[region][city][about] = 1;
            }
        }
    
        console.log("about_posts:", about_posts);
        res.render('index', { about_posts, show_counting, layout: 'landing.hbs' });
    } catch (err) {
        console.error("Error fetching posts:", err);
        // Handle error
        res.status(500).send("Error fetching posts");
    }
    
}

module.exports = ctrl;