//controlador: objeto con funciones
const ctrl = {};

const { Post } = require('../models');
const sidebar = require('../helpers/sidebar');

ctrl.find_count = async (req, res) => {
    let show_counting = false
    const city = req.params.city; // Assuming req.params.city contains the city name
    const about_posts = {};

    try {
        show_counting = true
        // Fetch posts from MongoDB
        const posts = await Post.find({ where: city }).sort({ timestamp: -1 }).lean();

        // Process each post to populate about_posts
        for (let i in posts) {
            const about = posts[i].about;

            // Initialize the city entry if it doesn't exist
            if (!about_posts.hasOwnProperty(city)) {
                about_posts[city] = {};
            }

            // Increment the count for the specific topic in the city entry
            if (about_posts[city].hasOwnProperty(about)) {
                about_posts[city][about] += 1;
            } else {
                about_posts[city][about] = 1;
            }
        }
        console.log("about_posts:", about_posts);
        res.render('index', { about_posts, show_counting, layout: 'landing_page.hbs' });
    } catch (err) {
        console.error("Error fetching posts:", err);
        // Handle error
        res.status(500).send("Error fetching posts");
    }
}

module.exports = ctrl;