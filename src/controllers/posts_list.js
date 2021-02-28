//controlador: objeto con funciones
const ctrl = {};

const { Post } = require('../models');
const sidebar = require('../helpers/sidebar');
var ObjectId = require('mongoose').Types.ObjectId;

ctrl.index = async (req, res) => {
    if (req.query.search){
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        Post.find({title: regex}, async function(err, posts){
            if(err){
                console.log(err)
            } else{
                let viewModel = { posts: [] };
                viewModel.posts = posts;
                viewModel = await sidebar(viewModel);
                res.render('posts_list', viewModel);
            }
        }).sort({timestamp: -1}).lean()
    } else {
        const posts  = await Post.find().sort({timestamp: -1}).lean() ;
        var posts_and_more = [];
        for (let i in posts){
            const writer = await Post.aggregate([{
                $match:{_id: posts[i]._id}},
                {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "usuario"}
                }
                ]);
            const author = writer[0].usuario[0];
            posts[i].author = author.name;
            posts_and_more.push(posts[i])
            };
        let viewModel = { posts_and_more: [] };
        //viewModel.posts = posts;
        viewModel.posts = posts_and_more;
        viewModel = await sidebar(viewModel);
        res.render('posts_list', viewModel);
    }
};

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

ctrl.find_about = async (req, res) => {
    const concerning = req.params.about;
    const posts = await Post.find({about: req.params.about}).sort({timestamp: -1}).lean();

    var posts_and_more = [];
        for (let i in posts){
            const writer = await Post.aggregate([{
                $match:{_id: posts[i]._id}},
                {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "usuario"}
                }
                ]);
            const author = writer[0].usuario[0];
            posts[i].author = author.name;
            posts_and_more.push(posts[i])
            };
        let viewModel = { posts_and_more: [] };
        viewModel.posts = posts_and_more;
        viewModel.concerning = concerning;
        viewModel = await sidebar(viewModel);
        res.render('topic', viewModel);
}

ctrl.find_where = async (req, res) => {
    const concerning = req.params.city;
    const posts = await Post.find({where: req.params.city}).sort({timestamp: -1}).lean();

    var posts_and_more = [];
        for (let i in posts){
            const writer = await Post.aggregate([{
                $match:{_id: posts[i]._id}},
                {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "usuario"}
                }
                ]);
            const author = writer[0].usuario[0];
            posts[i].author = author.name;
            posts_and_more.push(posts[i])
            };
        let viewModel = { posts_and_more: [] };
        viewModel.concerning = concerning;
        viewModel.posts = posts_and_more;
        viewModel = await sidebar(viewModel);
        res.render('topic', viewModel);
}

module.exports = ctrl;