//controlador: objeto con funciones
const ctrl = {};

const { Post } = require('../models');
const sidebar = require('../helpers/sidebar');
const {escapeRegex, getPageRange} = require("../helpers/libs");

const totalPages = 100;
const pagesPerSet = 10;

ctrl.index = async (req, res) => {
    const pagination = req.query.pagination ? parseInt(req.query.pagination) : 4;
    const currentPage = req.query.page ? parseInt(req.query.page) : 1;

    let posts;
    let totalPosts;
    if (req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        posts = await Post.find({ title: regex })
            .skip((currentPage - 1) * pagination)
            .limit(pagination)
            .sort({ timestamp: -1 }).lean();
        totalPosts = await Post.find({ title: regex });
    } else {
        posts = await Post.find()
            .skip((currentPage - 1) * pagination)
            .limit(pagination)
            .sort({ timestamp: -1 }).lean();
        totalPosts = await Post.find();
    }

    const url = req.originalUrl.split('?')[0];
    const startPage = Math.floor((currentPage - 1) / pagesPerSet) * pagesPerSet + 1;
    const endPage = Math.min(startPage + pagesPerSet - 1, totalPages);
    const hasPreviousSet = startPage > 1;
    const hasNextSet = endPage < totalPages;
    const previousSetStart = Math.max(1, startPage - pagesPerSet);
    const nextSetStart = Math.min(totalPages, endPage + 1);
    const pages = Math.ceil(totalPosts.length / pagination);
    const count = getPageRange(pages, currentPage);

    let viewModel = {
        posts: [],
        currentPage,
        pages: count,
        currentTotalPages: pages,
        hasPreviousSet,
        previousSetStart,
        hasNextSet,
        nextSetStart,
        url
    };

    // Loop over posts and fetch the author and like/save status
    for (let i in posts) {
        const writer = await Post.aggregate([
            { $match: { _id: posts[i]._id } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'usuario',
                }
            }
        ]);

        const author = writer[0].usuario[0];
        posts[i].author = author.name;

        // Check if the user has liked the post
        if (req.user != null) {
            // Convert req.user._id to ObjectId for comparison
            if (posts[i].likes.some(like => like.toString() === req.user.id)) {
                posts[i].user_liked = true;  // Set user_liked flag
            } else {
                posts[i].user_liked = false; // Set user_liked flag to false
            }

            // Check if the user has saved the post
            if (posts[i].saved_by.some(saved => saved.toString() === req.user.id)) {
                posts[i].user_saved = true;  // Set user_saved flag
            } else {
                posts[i].user_saved = false; // Set user_saved flag to false
            }
        } else {
            posts[i].user_liked = false;  // If no user is logged in, set user_liked to false
            posts[i].user_saved = false;  // If no user is logged in, set user_saved to false
        }

        // Add the post to the final list
        viewModel.posts.push(posts[i]);
    }

    // Add sidebar data to the view model
    viewModel = await sidebar(viewModel);

    // Render the page with the view model
    res.render('posts_list', viewModel);
};


ctrl.find_category = async (req, res) => {
    const pagination = req.query.pagination ? parseInt(req.query.pagination) : 4;
    const currentPage = req.query.page ? parseInt(req.query.page) : 1;
    const startPage = Math.floor((currentPage - 1) / pagesPerSet) * pagesPerSet + 1;
    const endPage = Math.min(startPage + pagesPerSet - 1, totalPages);
    const category = req.params.category;

    // Fetch posts based on the category
    const posts = await Post.find({ "about.category": category })
        .skip((currentPage - 1) * pagination)
        .limit(pagination)
        .sort({ timestamp: -1 }).lean();
    const totalPosts = await Post.find({ "about.category": category });
    const pages = Math.ceil(totalPosts.length / pagination);

    count = getPageRange(pages, currentPage);

    const hasPreviousSet = startPage > 1;
    const hasNextSet = endPage < totalPages;
    const previousSetStart = Math.max(1, startPage - pagesPerSet);
    const nextSetStart = Math.min(totalPages, endPage + 1);

    var viewModel = {};
    var posts_and_more = [];  // We should use this array, not `viewModel.posts`

    // Loop through each post to fetch author info and like/save status
    for (let i in posts) {
        const writer = await Post.aggregate([{
            $match: { _id: posts[i]._id }
        }, {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "usuario"
            }
        }]);
        
        const author = writer[0].usuario[0];
        posts[i].author = author.name;

        // Check if the user has liked the post
        if (req.user != null) {
            // Convert req.user._id to ObjectId for comparison
            if (posts[i].likes.some(like => like.toString() === req.user.id)) {
                posts[i].user_liked = true;  // Set user_liked flag
            } else {
                posts[i].user_liked = false; // Set user_liked flag to false
            }

            // Check if the user has saved the post
            if (posts[i].saved_by.some(saved => saved.toString() === req.user.id)) {
                posts[i].user_saved = true;  // Set user_saved flag
            } else {
                posts[i].user_saved = false; // Set user_saved flag to false
            }
        } else {
            posts[i].user_liked = false;  // If no user is logged in, set user_liked to false
            posts[i].user_saved = false;  // If no user is logged in, set user_saved to false
        }

        // Add the post to the final list
        posts_and_more.push(posts[i]);  // Add posts to this array
    }

    // After the loop, assign `posts_and_more` to the `viewModel.posts` array
    viewModel.posts = posts_and_more;

    // Prepare pagination and other data
    viewModel.currentPage = currentPage;
    viewModel.pages = count;
    viewModel.currentTotalPages = pages;
    viewModel.hasPreviousSet = hasPreviousSet;
    viewModel.previousSetStart = previousSetStart;
    viewModel.hasNextSet = hasNextSet;
    viewModel.nextSetStart = nextSetStart;
    viewModel.concerning = category;

    // Add sidebar data to the view model
    viewModel = await sidebar(viewModel);

    // Render the page with the view model
    res.render('topic', viewModel);
};


ctrl.find_subcategory = async (req, res) => {
    const pagination = req.query.pagination ? parseInt(req.query.pagination) : 4;
    const currentPage = req.query.page ? parseInt(req.query.page) : 1;
    const category = req.params.category;
    const subcategory = req.params.subcategory;

    // Calculate pagination values
    const startPage = Math.floor((currentPage - 1) / pagesPerSet) * pagesPerSet + 1;
    const endPage = Math.min(startPage + pagesPerSet - 1, totalPages);

    // Fetch posts based on the category and subcategory
    const posts = await Post.find({ "about.category": category, "about.subcategory": subcategory })
        .skip((currentPage - 1) * pagination)
        .limit(pagination)
        .sort({ timestamp: -1 }).lean();

    const totalPosts = await Post.find({ "about.category": category, "about.subcategory": subcategory });
    const pages = Math.ceil(totalPosts.length / pagination);
    const count = getPageRange(pages, currentPage);

    const hasPreviousSet = startPage > 1;
    const hasNextSet = endPage < totalPages;
    const previousSetStart = Math.max(1, startPage - pagesPerSet);
    const nextSetStart = Math.min(totalPages, endPage + 1);

    // ViewModel initialization
    let viewModel = {};
    let posts_and_more = [];

    // Loop over posts to fetch additional information and like/save status
    for (let i in posts) {
        const writer = await Post.aggregate([
            { $match: { _id: posts[i]._id } },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "usuario"
                }
            }
        ]);

        const author = writer[0].usuario[0];
        posts[i].author = author.name;

        // Check if the user has liked the post
        if (req.user != null) {
            posts[i].user_liked = posts[i].likes.some(like => like.toString() === req.user.id);
            
            // Check if the user has saved the post
            posts[i].user_saved = posts[i].saved_by.some(saved => saved.toString() === req.user.id);
        } else {
            posts[i].user_liked = false;
            posts[i].user_saved = false;
        }

        posts_and_more.push(posts[i]);
    }

    // Set up the view model
    viewModel.posts = posts_and_more;
    viewModel.currentPage = currentPage;
    viewModel.pages = count;
    viewModel.currentTotalPages = pages;
    viewModel.hasPreviousSet = hasPreviousSet;
    viewModel.previousSetStart = previousSetStart;
    viewModel.hasNextSet = hasNextSet;
    viewModel.nextSetStart = nextSetStart;
    viewModel.concerning = subcategory;

    // Add sidebar data to the view model
    viewModel = await sidebar(viewModel);

    // Render the page with the view model
    res.render('topic', viewModel);
};


ctrl.find_city = async (req, res) => {
    const pagination = req.query.pagination ? parseInt(req.query.pagination) : 4;
    const currentPage = req.query.page ? parseInt(req.query.page) : 1;
    const prefecture = req.params.prefecture;
    const city = req.params.city;

    // Calculate pagination values
    const startPage = Math.floor((currentPage - 1) / pagesPerSet) * pagesPerSet + 1;
    const endPage = Math.min(startPage + pagesPerSet - 1, totalPages);

    // Fetch posts based on the prefecture and city
    const posts = await Post.find({ "where.prefecture": prefecture, "where.city": city })
        .skip((currentPage - 1) * pagination)
        .limit(pagination)
        .sort({ timestamp: -1 }).lean();

    const totalPosts = await Post.find({ "where.city": city });
    const pages = Math.ceil(totalPosts.length / pagination);
    const count = getPageRange(pages, currentPage);

    const hasPreviousSet = startPage > 1;
    const hasNextSet = endPage < totalPages;
    const previousSetStart = Math.max(1, startPage - pagesPerSet);
    const nextSetStart = Math.min(totalPages, endPage + 1);

    // Initialize viewModel
    let viewModel = {};
    let posts_and_more = [];

    // Loop through posts to fetch author info and like/save status
    for (let i in posts) {
        const writer = await Post.aggregate([
            { $match: { _id: posts[i]._id } },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "usuario"
                }
            }
        ]);

        const author = writer[0].usuario[0];
        posts[i].author = author.name;

        // Check if the user has liked the post
        if (req.user != null) {
            posts[i].user_liked = posts[i].likes.some(like => like.toString() === req.user.id);

            // Check if the user has saved the post
            posts[i].user_saved = posts[i].saved_by.some(saved => saved.toString() === req.user.id);
        } else {
            posts[i].user_liked = false;
            posts[i].user_saved = false;
        }

        posts_and_more.push(posts[i]);
    }

    // Set up the view model
    viewModel.posts = posts_and_more;
    viewModel.currentPage = currentPage;
    viewModel.pages = count;
    viewModel.currentTotalPages = pages;
    viewModel.hasPreviousSet = hasPreviousSet;
    viewModel.previousSetStart = previousSetStart;
    viewModel.hasNextSet = hasNextSet;
    viewModel.nextSetStart = nextSetStart;
    viewModel.concerning = city;

    // Add sidebar data to the view model
    viewModel = await sidebar(viewModel);

    // Render the page with the view model
    res.render('topic', viewModel);
};


ctrl.find_prefecture = async (req, res) => {
    const pagination = req.query.pagination ? parseInt(req.query.pagination) : 4;
    const currentPage = req.query.page ? parseInt(req.query.page) : 1;
    const prefecture = req.params.prefecture;

    // Calculate pagination values
    const startPage = Math.floor((currentPage - 1) / pagesPerSet) * pagesPerSet + 1;
    const endPage = Math.min(startPage + pagesPerSet - 1, totalPages);

    // Fetch posts based on the prefecture
    const posts = await Post.find({ "where.prefecture": prefecture })
        .skip((currentPage - 1) * pagination)
        .limit(pagination)
        .sort({ timestamp: -1 }).lean();

    const totalPosts = await Post.find({ "where.prefecture": prefecture });
    const pages = Math.ceil(totalPosts.length / pagination);
    const count = getPageRange(pages, currentPage);

    // Pagination setup
    const hasPreviousSet = startPage > 1;
    const hasNextSet = endPage < totalPages;
    const previousSetStart = Math.max(1, startPage - pagesPerSet);
    const nextSetStart = Math.min(totalPages, endPage + 1);

    // Initialize the view model
    let viewModel = {};
    let posts_and_more = [];

    // Loop through posts to fetch author info and like/save status
    for (let i in posts) {
        const writer = await Post.aggregate([
            { $match: { _id: posts[i]._id } },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "usuario"
                }
            }
        ]);

        const author = writer[0].usuario[0];
        posts[i].author = author.name;

        // Check if the user has liked or saved the post
        if (req.user != null) {
            posts[i].user_liked = posts[i].likes.some(like => like.toString() === req.user.id);
            posts[i].user_saved = posts[i].saved_by.some(saved => saved.toString() === req.user.id);
        } else {
            posts[i].user_liked = false;
            posts[i].user_saved = false;
        }

        posts_and_more.push(posts[i]);
    }

    // Set up the view model with all necessary data
    viewModel.posts = posts_and_more;
    viewModel.currentPage = currentPage;
    viewModel.pages = count;
    viewModel.currentTotalPages = pages;
    viewModel.hasPreviousSet = hasPreviousSet;
    viewModel.previousSetStart = previousSetStart;
    viewModel.hasNextSet = hasNextSet;
    viewModel.nextSetStart = nextSetStart;
    viewModel.concerning = prefecture;

    // Add sidebar data to the view model
    viewModel = await sidebar(viewModel);

    // Render the page with the view model
    res.render('topic', viewModel);
};


ctrl.find_city_and_category = async (req, res) => {
    const pagination = req.query.pagination ? parseInt(req.query.pagination) : 4;
    const currentPage = req.query.page ? parseInt(req.query.page) : 1;
    const prefecture = req.params.prefecture;
    const city = req.params.city;
    const category = req.params.category;

    // Pagination logic
    const startPage = Math.floor((currentPage - 1) / pagesPerSet) * pagesPerSet + 1;
    const endPage = Math.min(startPage + pagesPerSet - 1, totalPages);

    // Fetch posts based on prefecture, city, and category
    const posts = await Post.find({ "where.prefecture": prefecture, "where.city": city, "about.category": category })
        .skip((currentPage - 1) * pagination)
        .limit(pagination)
        .sort({ timestamp: -1 })
        .lean();

    const totalPosts = await Post.find({ "where.prefecture": prefecture, "where.city": city, "about.category": category });
    const pages = Math.ceil(totalPosts.length / pagination);
    const count = getPageRange(pages, currentPage);

    // Pagination controls
    const hasPreviousSet = startPage > 1;
    const hasNextSet = endPage < totalPages;
    const previousSetStart = Math.max(1, startPage - pagesPerSet);
    const nextSetStart = Math.min(totalPages, endPage + 1);

    // Prepare the view model
    let viewModel = {};
    let posts_and_more = [];

    // Loop through each post to fetch author and like/save status
    for (let i in posts) {
        const writer = await Post.aggregate([
            { $match: { _id: posts[i]._id } },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "usuario"
                }
            }
        ]);

        const author = writer[0].usuario[0];
        posts[i].author = author.name;

        // Check if the user has liked or saved the post
        if (req.user != null) {
            posts[i].user_liked = posts[i].likes.some(like => like.toString() === req.user.id);
            posts[i].user_saved = posts[i].saved_by.some(saved => saved.toString() === req.user.id);
        } else {
            posts[i].user_liked = false;
            posts[i].user_saved = false;
        }

        posts_and_more.push(posts[i]);
    }

    // Set up the final view model
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

    // Add sidebar data to the view model
    viewModel = await sidebar(viewModel);

    // Render the page with the view model
    res.render('location_topic', viewModel);
};


ctrl.find_city_and_subcategory = async (req, res) => {
    const pagination = req.query.pagination ? parseInt(req.query.pagination) : 4;
    const currentPage = req.query.page ? parseInt(req.query.page) : 1;
    const prefecture = req.params.prefecture;
    const city = req.params.city;
    const category = req.params.category;
    const subcategory = req.params.subcategory;

    // Pagination logic
    const startPage = Math.floor((currentPage - 1) / pagesPerSet) * pagesPerSet + 1;
    const endPage = Math.min(startPage + pagesPerSet - 1, totalPages);

    // Fetch posts based on prefecture, city, category, and subcategory
    const posts = await Post.find({ 
        "where.prefecture": prefecture, 
        "where.city": city, 
        "about.category": category, 
        "about.subcategory": subcategory 
    })
    .skip((currentPage - 1) * pagination)
    .limit(pagination)
    .sort({ timestamp: -1 })
    .lean();

    const totalPosts = await Post.find({ 
        "where.prefecture": prefecture, 
        "where.city": city, 
        "about.category": category, 
        "about.subcategory": subcategory 
    });
    const pages = Math.ceil(totalPosts.length / pagination);
    const count = getPageRange(pages, currentPage);

    // Pagination controls
    const hasPreviousSet = startPage > 1;
    const hasNextSet = endPage < totalPages;
    const previousSetStart = Math.max(1, startPage - pagesPerSet);
    const nextSetStart = Math.min(totalPages, endPage + 1);

    // Prepare the view model
    let viewModel = {};
    let posts_and_more = [];

    // Loop through each post to fetch author and like/save status
    for (let i in posts) {
        const writer = await Post.aggregate([
            { $match: { _id: posts[i]._id } },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "usuario"
                }
            }
        ]);

        const author = writer[0].usuario[0];
        posts[i].author = author.name;

        // Check if the user has liked or saved the post
        if (req.user != null) {
            posts[i].user_liked = posts[i].likes.some(like => like.toString() === req.user.id);
            posts[i].user_saved = posts[i].saved_by.some(saved => saved.toString() === req.user.id);
        } else {
            posts[i].user_liked = false;
            posts[i].user_saved = false;
        }

        posts_and_more.push(posts[i]);
    }

    // Set up the final view model
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

    // Add sidebar data to the view model
    viewModel = await sidebar(viewModel);

    // Render the page with the view model
    res.render('location_topic', viewModel);
};


ctrl.find_prefecture_and_category = async (req, res) => {
    const pagination = req.query.pagination ? parseInt(req.query.pagination) : 4;
    const currentPage = req.query.page ? parseInt(req.query.page) : 1;
    const prefecture = req.params.prefecture;
    const category = req.params.category;

    // Pagination logic
    const startPage = Math.floor((currentPage - 1) / pagesPerSet) * pagesPerSet + 1;
    const endPage = Math.min(startPage + pagesPerSet - 1, totalPages);

    // Fetch posts based on prefecture and category
    const posts = await Post.find({ 
        "where.prefecture": prefecture, 
        "about.category": category 
    })
    .skip((currentPage - 1) * pagination)
    .limit(pagination)
    .sort({ timestamp: -1 })
    .lean();

    const totalPosts = await Post.find({ 
        "where.prefecture": prefecture, 
        "about.category": category 
    });
    const pages = Math.ceil(totalPosts.length / pagination);
    const count = getPageRange(pages, currentPage);

    // Pagination controls
    const hasPreviousSet = startPage > 1;
    const hasNextSet = endPage < totalPages;
    const previousSetStart = Math.max(1, startPage - pagesPerSet);
    const nextSetStart = Math.min(totalPages, endPage + 1);

    // Prepare the view model
    let viewModel = {};
    let posts_and_more = [];

    // Loop through each post to fetch author and like/save status
    for (let i in posts) {
        const writer = await Post.aggregate([
            { $match: { _id: posts[i]._id } },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "usuario"
                }
            }
        ]);

        const author = writer[0].usuario[0];
        posts[i].author = author.name;

        // Check if the user has liked or saved the post
        if (req.user != null) {
            posts[i].user_liked = posts[i].likes.some(like => like.toString() === req.user.id);
            posts[i].user_saved = posts[i].saved_by.some(saved => saved.toString() === req.user.id);
        } else {
            posts[i].user_liked = false;
            posts[i].user_saved = false;
        }

        posts_and_more.push(posts[i]);
    }

    // Set up the final view model
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

    // Add sidebar data to the view model
    viewModel = await sidebar(viewModel);

    // Render the page with the view model
    res.render('location_topic', viewModel);
};


ctrl.find_prefecture_and_subcategory = async (req, res) => {
    const pagination = req.query.pagination ? parseInt(req.query.pagination) : 4;
    const currentPage = req.query.page ? parseInt(req.query.page) : 1;
    const prefecture = req.params.prefecture;
    const subcategory = req.params.subcategory;

    // Pagination logic
    const startPage = Math.floor((currentPage - 1) / pagesPerSet) * pagesPerSet + 1;
    const endPage = Math.min(startPage + pagesPerSet - 1, totalPages);

    // Fetch posts based on prefecture and subcategory
    const posts = await Post.find({ 
        "where.prefecture": prefecture, 
        "about.subcategory": subcategory 
    })
    .skip((currentPage - 1) * pagination)
    .limit(pagination)
    .sort({ timestamp: -1 })
    .lean();

    const totalPosts = await Post.find({ 
        "where.prefecture": prefecture, 
        "about.subcategory": subcategory 
    });
    const pages = Math.ceil(totalPosts.length / pagination);
    const count = getPageRange(pages, currentPage);

    // Pagination controls
    const hasPreviousSet = startPage > 1;
    const hasNextSet = endPage < totalPages;
    const previousSetStart = Math.max(1, startPage - pagesPerSet);
    const nextSetStart = Math.min(totalPages, endPage + 1);

    // Prepare the view model
    let viewModel = {};
    let posts_and_more = [];

    // Loop through each post to fetch author and like/save status
    for (let i in posts) {
        const writer = await Post.aggregate([
            { $match: { _id: posts[i]._id } },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "usuario"
                }
            }
        ]);

        const author = writer[0].usuario[0];
        posts[i].author = author.name;

        // Check if the user has liked or saved the post
        if (req.user != null) {
            posts[i].user_liked = posts[i].likes.some(like => like.toString() === req.user.id);
            posts[i].user_saved = posts[i].saved_by.some(saved => saved.toString() === req.user.id);
        } else {
            posts[i].user_liked = false;
            posts[i].user_saved = false;
        }

        posts_and_more.push(posts[i]);
    }

    // Set up the final view model
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

    // Add sidebar data to the view model
    viewModel = await sidebar(viewModel);

    // Render the page with the view model
    res.render('location_topic', viewModel);
};

module.exports = ctrl;