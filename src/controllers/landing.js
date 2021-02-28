//controlador: objeto con funciones
const ctrl = {};

const { Post } = require('../models');
const sidebar = require('../helpers/sidebar');

ctrl.find_count = async (req, res) => {
    var about_posts= {}
    const posts = await Post.find({where: req.params.city}).sort({timestamp: -1}).lean();
    for (let i in posts){
        if(about_posts.hasOwnProperty(posts[i].about)){
            about_posts[posts[i].about].push(posts[i])
        }
        else{
            posts_lst = []
            posts_lst.push(posts[i])
            about_posts[posts[i].about] = posts_lst
        }
    }
    res.render('index', {about_posts, layout: 'landing_page.hbs'});
}

module.exports = ctrl;