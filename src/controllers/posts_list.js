//controlador: objeto con funciones
const ctrl = {};

const { Post } = require('../models');
const sidebar = require('../helpers/sidebar');
const {escapeRegex, getPageRange} = require("../helpers/libs");

const totalPages = 100;
const pagesPerSet = 10;


ctrl.index = async (req, res) => {
    const pagination = req.query.pagination ? parseInt(req.query.pagination): 4;
    const currentPage = req.query.page ? parseInt(req.query.page): 1;
    if (req.query.search){
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        var posts = await Post.find({title: regex})
        .skip((currentPage - 1) * pagination)
        .limit(pagination)
        .sort({timestamp: -1}).lean()
        var totalPosts = await Post.find({title: regex})
    } else {
        var posts  = await Post.find()
        .skip((currentPage - 1) * pagination)
        .limit(pagination)
        .sort({timestamp: -1}).lean()
        var totalPosts = await Post.find()
    }
    const url = req.originalUrl.split('?')[0];
    const startPage = Math.floor((currentPage - 1) / pagesPerSet) * pagesPerSet + 1;
    const endPage = Math.min(startPage + pagesPerSet - 1, totalPages);
    const hasPreviousSet = startPage > 1;
    const hasNextSet = endPage < totalPages;
    const previousSetStart = Math.max(1, startPage - pagesPerSet);
    const nextSetStart = Math.min(totalPages, endPage + 1);
    var pages = Math.ceil(totalPosts.length/pagination)
    const count = getPageRange(pages, currentPage)

    var viewModel = {};
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
};


ctrl.find_category = async (req, res) => {
    const pagination = req.query.pagination ? parseInt(req.query.pagination): 4;
    const currentPage = req.query.page ? parseInt(req.query.page): 1;
    const startPage = Math.floor((currentPage - 1) / pagesPerSet) * pagesPerSet + 1;
    const endPage = Math.min(startPage + pagesPerSet - 1, totalPages);
    const category = req.params.category;
    const posts = await Post.find({ "about.category": category})
    .skip((currentPage - 1) * pagination)
    .limit(pagination)
    .sort({timestamp: -1}).lean();
    const totalPosts = await Post.find({ "about.category": category})
    const pages = Math.ceil(totalPosts.length/pagination)

    count = getPageRange(pages, currentPage)
    
    const hasPreviousSet = startPage > 1;
    const hasNextSet = endPage < totalPages;
    const previousSetStart = Math.max(1, startPage - pagesPerSet);
    const nextSetStart = Math.min(totalPages, endPage + 1);

    var viewModel = {};
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
        
        viewModel.posts = posts_and_more;
        viewModel.currentPage = currentPage;
        viewModel.pages = count;
        viewModel.currentTotalPages = pages;
        viewModel.hasPreviousSet = hasPreviousSet;
        viewModel.previousSetStart = previousSetStart;
        viewModel.hasNextSet = hasNextSet;
        viewModel.nextSetStart = nextSetStart;
        viewModel.concerning = category;
        viewModel = await sidebar(viewModel);
        res.render('topic', viewModel);
}

ctrl.find_subcategory = async (req, res) => {
    const pagination = req.query.pagination ? parseInt(req.query.pagination): 4;
    const currentPage = req.query.page ? parseInt(req.query.page): 1;
    const startPage = Math.floor((currentPage - 1) / pagesPerSet) * pagesPerSet + 1;
    const endPage = Math.min(startPage + pagesPerSet - 1, totalPages);
    const category = req.params.category;
    const subcategory = req.params.subcategory;
    const posts = await Post.find({ "about.category": category, "about.subcategory": subcategory})
    .skip((currentPage - 1) * pagination)
    .limit(pagination)
    .sort({timestamp: -1}).lean();
    const totalPosts = await Post.find({ "about.category": category, "about.subcategory": subcategory})
    const pages = Math.ceil(totalPosts.length/pagination)

    count = getPageRange(pages, currentPage)
    
    const hasPreviousSet = startPage > 1;
    const hasNextSet = endPage < totalPages;
    const previousSetStart = Math.max(1, startPage - pagesPerSet);
    const nextSetStart = Math.min(totalPages, endPage + 1);

    var viewModel = {};
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
        
        viewModel.posts = posts_and_more;
        viewModel.currentPage = currentPage;
        viewModel.pages = count;
        viewModel.currentTotalPages = pages;
        viewModel.hasPreviousSet = hasPreviousSet;
        viewModel.previousSetStart = previousSetStart;
        viewModel.hasNextSet = hasNextSet;
        viewModel.nextSetStart = nextSetStart;
        viewModel.concerning = subcategory;
        viewModel = await sidebar(viewModel);
        res.render('topic', viewModel);
}

ctrl.find_city = async (req, res) => {
    const pagination = req.query.pagination ? parseInt(req.query.pagination): 4;
    const currentPage = req.query.page ? parseInt(req.query.page): 1;
    const startPage = Math.floor((currentPage - 1) / pagesPerSet) * pagesPerSet + 1;
    const endPage = Math.min(startPage + pagesPerSet - 1, totalPages);
    const prefecture = req.params.prefecture;
    const city = req.params.city;
    const posts = await Post.find({ "where.prefecture": prefecture, "where.city": city})
    .skip((currentPage - 1) * pagination)
    .limit(pagination)
    .sort({timestamp: -1}).lean();
    const totalPosts = await Post.find({ "where.city": city })
    const pages = Math.ceil(totalPosts.length/pagination)

    count = getPageRange(pages, currentPage)

    const hasPreviousSet = startPage > 1;
    const hasNextSet = endPage < totalPages;
    const previousSetStart = Math.max(1, startPage - pagesPerSet);
    const nextSetStart = Math.min(totalPages, endPage + 1);

    var viewModel = {};
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
        
        viewModel.posts = posts_and_more;
        viewModel.currentPage = currentPage;
        viewModel.pages = count;
        viewModel.currentTotalPages = pages;
        viewModel.hasPreviousSet = hasPreviousSet;
        viewModel.previousSetStart = previousSetStart;
        viewModel.hasNextSet = hasNextSet;
        viewModel.nextSetStart = nextSetStart;
        viewModel.concerning = city;
        viewModel = await sidebar(viewModel);
        res.render('topic', viewModel);
}

ctrl.find_prefecture = async (req, res) => {
    const pagination = req.query.pagination ? parseInt(req.query.pagination): 4;
    const currentPage = req.query.page ? parseInt(req.query.page): 1;
    const startPage = Math.floor((currentPage - 1) / pagesPerSet) * pagesPerSet + 1;
    const endPage = Math.min(startPage + pagesPerSet - 1, totalPages);
    const prefecture = req.params.prefecture;
    const posts = await Post.find({ "where.prefecture": prefecture })
    .skip((currentPage - 1) * pagination)
    .limit(pagination)
    .sort({timestamp: -1}).lean();
    const totalPosts = await Post.find({ "where.prefecture": prefecture })
    const pages = Math.ceil(totalPosts.length/pagination)

    count = getPageRange(pages, currentPage)

    const hasPreviousSet = startPage > 1;
    const hasNextSet = endPage < totalPages;
    const previousSetStart = Math.max(1, startPage - pagesPerSet);
    const nextSetStart = Math.min(totalPages, endPage + 1);

    var viewModel = {};
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
        
        viewModel.posts = posts_and_more;
        viewModel.currentPage = currentPage;
        viewModel.pages = count;
        viewModel.currentTotalPages = pages;
        viewModel.hasPreviousSet = hasPreviousSet;
        viewModel.previousSetStart = previousSetStart;
        viewModel.hasNextSet = hasNextSet;
        viewModel.nextSetStart = nextSetStart;
        viewModel.concerning = prefecture;
        viewModel = await sidebar(viewModel);
        res.render('topic', viewModel);
}

ctrl.find_city_and_category = async (req, res) => {
    const pagination = req.query.pagination ? parseInt(req.query.pagination): 4;
    const currentPage = req.query.page ? parseInt(req.query.page): 1;
    const startPage = Math.floor((currentPage - 1) / pagesPerSet) * pagesPerSet + 1;
    const endPage = Math.min(startPage + pagesPerSet - 1, totalPages);
    const prefecture = req.params.prefecture;
    const city = req.params.city;
    const category = req.params.category;
    const posts = await Post.find({ "where.prefecture": prefecture, "where.city": city , "about.category": category })
    .skip((currentPage - 1) * pagination)
    .limit(pagination)
    .sort({timestamp: -1}).lean();
    const totalPosts = await Post.find({ "where.prefecture": prefecture, "where.city": city , "about.category": category })
    const pages = Math.ceil(totalPosts.length/pagination)
    
    count = getPageRange(pages, currentPage)

    const hasPreviousSet = startPage > 1;
    const hasNextSet = endPage < totalPages;
    const previousSetStart = Math.max(1, startPage - pagesPerSet);
    const nextSetStart = Math.min(totalPages, endPage + 1);

    var viewModel = {};
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
        
        viewModel.posts = posts_and_more;
        viewModel.currentPage = currentPage;
        viewModel.pages = count;
        viewModel.currentTotalPages = pages;
        viewModel.hasPreviousSet = hasPreviousSet;
        viewModel.previousSetStart = previousSetStart;
        viewModel.hasNextSet = hasNextSet;
        viewModel.nextSetStart = nextSetStart;
        viewModel.location = city;
        viewModel.about = category;
        viewModel = await sidebar(viewModel);
        res.render('location_topic', viewModel);
}

ctrl.find_city_and_subcategory = async (req, res) => {
    const pagination = req.query.pagination ? parseInt(req.query.pagination): 4;
    const currentPage = req.query.page ? parseInt(req.query.page): 1;
    const startPage = Math.floor((currentPage - 1) / pagesPerSet) * pagesPerSet + 1;
    const endPage = Math.min(startPage + pagesPerSet - 1, totalPages);
    const prefecture = req.params.prefecture;
    const city = req.params.city;
    const category = req.params.category;
    const subcategory = req.params.subcategory;
    const posts = await Post.find({ "where.prefecture": prefecture, "where.city": city, "about.category": category, "about.subcategory": subcategory })
    .skip((currentPage - 1) * pagination)
    .limit(pagination)
    .sort({timestamp: -1}).lean();
    const totalPosts = await Post.find({ "where.prefecture": prefecture, "where.city": city, "about.category": category , "about.subcategory": subcategory })
    const pages = Math.ceil(totalPosts.length/pagination)
    
    count = getPageRange(pages, currentPage)

    const hasPreviousSet = startPage > 1;
    const hasNextSet = endPage < totalPages;
    const previousSetStart = Math.max(1, startPage - pagesPerSet);
    const nextSetStart = Math.min(totalPages, endPage + 1);

    var viewModel = {};
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
        
        viewModel.posts = posts_and_more;
        viewModel.currentPage = currentPage;
        viewModel.pages = count;
        viewModel.currentTotalPages = pages;
        viewModel.hasPreviousSet = hasPreviousSet;
        viewModel.previousSetStart = previousSetStart;
        viewModel.hasNextSet = hasNextSet;
        viewModel.nextSetStart = nextSetStart;
        viewModel.location = city;
        viewModel.about = subcategory;
        viewModel = await sidebar(viewModel);
        res.render('location_topic', viewModel);
}

ctrl.find_prefecture_and_category = async (req, res) => {
    const pagination = req.query.pagination ? parseInt(req.query.pagination): 4;
    const currentPage = req.query.page ? parseInt(req.query.page): 1;
    const startPage = Math.floor((currentPage - 1) / pagesPerSet) * pagesPerSet + 1;
    const endPage = Math.min(startPage + pagesPerSet - 1, totalPages);
    const prefecture = req.params.prefecture;
    const category = req.params.category;
    const posts = await Post.find({ "where.prefecture": prefecture, "about.category": category })
    .skip((currentPage - 1) * pagination)
    .limit(pagination)
    .sort({timestamp: -1}).lean();
    const totalPosts = await Post.find({ "where.prefecture": prefecture, "about.category": category })
    const pages = Math.ceil(totalPosts.length/pagination)
    
    count = getPageRange(pages, currentPage)

    const hasPreviousSet = startPage > 1;
    const hasNextSet = endPage < totalPages;
    const previousSetStart = Math.max(1, startPage - pagesPerSet);
    const nextSetStart = Math.min(totalPages, endPage + 1);

    var viewModel = {};
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
        
        viewModel.posts = posts_and_more;
        viewModel.currentPage = currentPage;
        viewModel.pages = count;
        viewModel.currentTotalPages = pages;
        viewModel.hasPreviousSet = hasPreviousSet;
        viewModel.previousSetStart = previousSetStart;
        viewModel.hasNextSet = hasNextSet;
        viewModel.nextSetStart = nextSetStart;
        viewModel.location = prefecture;
        viewModel.about = category;
        viewModel = await sidebar(viewModel);
        res.render('location_topic', viewModel);
}

ctrl.find_prefecture_and_subcategory = async (req, res) => {
    const pagination = req.query.pagination ? parseInt(req.query.pagination): 4;
    const currentPage = req.query.page ? parseInt(req.query.page): 1;
    const startPage = Math.floor((currentPage - 1) / pagesPerSet) * pagesPerSet + 1;
    const endPage = Math.min(startPage + pagesPerSet - 1, totalPages);
    const prefecture = req.params.prefecture;
    const subcategory = req.params.subcategory;
    const posts = await Post.find({ "where.prefecture": prefecture, "about.subcategory": subcategory })
    .skip((currentPage - 1) * pagination)
    .limit(pagination)
    .sort({timestamp: -1}).lean();
    const totalPosts = await Post.find({ "where.prefecture": prefecture, "about.subcategory": subcategory })
    const pages = Math.ceil(totalPosts.length/pagination)
    
    count = getPageRange(pages, currentPage)

    const hasPreviousSet = startPage > 1;
    const hasNextSet = endPage < totalPages;
    const previousSetStart = Math.max(1, startPage - pagesPerSet);
    const nextSetStart = Math.min(totalPages, endPage + 1);

    var viewModel = {};
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
        
        viewModel.posts = posts_and_more;
        viewModel.currentPage = currentPage;
        viewModel.pages = count;
        viewModel.currentTotalPages = pages;
        viewModel.hasPreviousSet = hasPreviousSet;
        viewModel.previousSetStart = previousSetStart;
        viewModel.hasNextSet = hasNextSet;
        viewModel.nextSetStart = nextSetStart;
        viewModel.location = prefecture;
        viewModel.about = subcategory;
        viewModel = await sidebar(viewModel);
        res.render('location_topic', viewModel);
}

module.exports = ctrl;