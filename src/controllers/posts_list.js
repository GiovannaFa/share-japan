//controlador: objeto con funciones
const ctrl = {};

const { Post } = require('../models');
const sidebar = require('../helpers/sidebar');
var ObjectId = require('mongoose').Types.ObjectId;
const {escapeRegex} = require("../helpers/libs");


const totalPages = 100;
const pagesPerSet = 10;

ctrl.index = async (req, res) => {
    const url = req.originalUrl.split('?')[0];
    if (req.query.search){
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        Post.find({title: regex}, async function(err, posts){
            if(err){
                console.error(err)
            } else{
                let viewModel = { posts: [] };
                viewModel.posts = posts;
                viewModel = await sidebar(viewModel);
                res.render('posts_list', viewModel);
            }
        }).sort({timestamp: -1}).lean()
    } else {
        const pagination = req.query.pagination ? parseInt(req.query.pagination): 4;
        const currentPage = req.query.page ? parseInt(req.query.page): 1;
        const startPage = Math.floor((currentPage - 1) / pagesPerSet) * pagesPerSet + 1;
        const endPage = Math.min(startPage + pagesPerSet - 1, totalPages);
        const totalPosts = await Post.find()
        const pages = Math.ceil(totalPosts.length/pagination)
        var count = []
        for (var i = 1; i <= pages; i++) {
            count.push(i);
        }
        const hasPreviousSet = startPage > 1;
        const hasNextSet = endPage < totalPages;
        const previousSetStart = Math.max(1, startPage - pagesPerSet);
        const nextSetStart = Math.min(totalPages, endPage + 1);
        const posts  = await Post.find()
        .skip((currentPage - 1) * pagination)
        .limit(pagination)
        .sort({timestamp: -1}).lean()

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
        viewModel.currentPage = currentPage;
        viewModel.pages = count;
        viewModel.currentTotalPages = pages;
        viewModel.hasPreviousSet = hasPreviousSet
        viewModel.previousSetStart = previousSetStart
        viewModel.hasNextSet = hasNextSet
        viewModel.nextSetStart = nextSetStart
        viewModel.url = url
        viewModel = await sidebar(viewModel);
        res.render('posts_list', viewModel);
    }
};


ctrl.find_about = async (req, res) => {
    const pagination = req.query.pagination ? parseInt(req.query.pagination): 4;
    const currentPage = req.query.page ? parseInt(req.query.page): 1;
    const startPage = Math.floor((currentPage - 1) / pagesPerSet) * pagesPerSet + 1;
    const endPage = Math.min(startPage + pagesPerSet - 1, totalPages);
    const concerning = req.params.about;
    const posts = await Post.find({about: req.params.about})
    .skip((currentPage - 1) * pagination)
    .limit(pagination)
    .sort({timestamp: -1}).lean();
    const pages = Math.ceil(posts.length/pagination)
    var count = []
        for (var i = 1; i <= pages; i++) {
            count.push(i);
        }
    const hasPreviousSet = startPage > 1;
    const hasNextSet = endPage < totalPages;
    const previousSetStart = Math.max(1, startPage - pagesPerSet);
    const nextSetStart = Math.min(totalPages, endPage + 1);

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
        viewModel.currentPage = currentPage;
        viewModel.pages = count;
        viewModel.currentTotalPages = pages;
        viewModel.hasPreviousSet = hasPreviousSet;
        viewModel.previousSetStart = previousSetStart;
        viewModel.hasNextSet = hasNextSet;
        viewModel.nextSetStart = nextSetStart;
        viewModel.concerning = concerning;
        viewModel = await sidebar(viewModel);
        res.render('topic', viewModel);
}

ctrl.find_where = async (req, res) => {
    const pagination = req.query.pagination ? parseInt(req.query.pagination): 4;
    const currentPage = req.query.page ? parseInt(req.query.page): 1;
    const startPage = Math.floor((currentPage - 1) / pagesPerSet) * pagesPerSet + 1;
    const endPage = Math.min(startPage + pagesPerSet - 1, totalPages);
    const concerning = req.params.city;
    const posts = await Post.find({where: req.params.city})
    .skip((currentPage - 1) * pagination)
    .limit(pagination)
    .sort({timestamp: -1}).lean();
    const pages = Math.ceil(posts.length/pagination)
    var count = []
        for (var i = 1; i <= pages; i++) {
            count.push(i);
        }
    const hasPreviousSet = startPage > 1;
    const hasNextSet = endPage < totalPages;
    const previousSetStart = Math.max(1, startPage - pagesPerSet);
    const nextSetStart = Math.min(totalPages, endPage + 1);

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
        viewModel.currentPage = currentPage;
        viewModel.pages = count;
        viewModel.currentTotalPages = pages;
        viewModel.hasPreviousSet = hasPreviousSet;
        viewModel.previousSetStart = previousSetStart;
        viewModel.hasNextSet = hasNextSet;
        viewModel.nextSetStart = nextSetStart;
        viewModel.concerning = concerning;
        viewModel = await sidebar(viewModel);
        res.render('topic', viewModel);
}

ctrl.find_where_about = async (req, res) => {
    const pagination = req.query.pagination ? parseInt(req.query.pagination): 4;
    const currentPage = req.query.page ? parseInt(req.query.page): 1;
    const startPage = Math.floor((currentPage - 1) / pagesPerSet) * pagesPerSet + 1;
    const endPage = Math.min(startPage + pagesPerSet - 1, totalPages);
    const city = req.params.city;
    const topic = req.params.topic;
    const posts = await Post.find({where: req.params.city, about: req.params.topic})
    .skip((currentPage - 1) * pagination)
    .limit(pagination)
    .sort({timestamp: -1}).lean();
    const pages = Math.ceil(posts.length/pagination)
    var count = []
        for (var i = 1; i <= pages; i++) {
            count.push(i);
        }
    const hasPreviousSet = startPage > 1;
    const hasNextSet = endPage < totalPages;
    const previousSetStart = Math.max(1, startPage - pagesPerSet);
    const nextSetStart = Math.min(totalPages, endPage + 1);

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
        viewModel.currentPage = currentPage;
        viewModel.pages = count;
        viewModel.currentTotalPages = pages;
        viewModel.hasPreviousSet = hasPreviousSet;
        viewModel.previousSetStart = previousSetStart;
        viewModel.hasNextSet = hasNextSet;
        viewModel.nextSetStart = nextSetStart;
        viewModel.city = city;
        viewModel.topic = topic;
        viewModel = await sidebar(viewModel);
        res.render('location_topic', viewModel);
}

module.exports = ctrl;