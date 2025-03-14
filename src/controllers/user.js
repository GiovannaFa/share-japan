const { User, Post }  = require('../models');
const passport = require('passport');
const sidebar = require('../helpers/sidebar');
const {randomString, getPageRange} = require("../helpers/libs");
var ObjectId = require('mongoose').Types.ObjectId;
const { verifyEmail, sendEmail } = require('../helpers/auth');

// const helpers = require('../helpers/libs');
const crypto = require('crypto');
require('../server/passport');
const ctrl = {};

const totalPages = 100;
const pagesPerSet = 10;


ctrl.signup = async (req, res) => {
    const { name, email, password, confirmPassword }  = req.body;
    const errors = [];
    const emailUser = await User.findOne({email:email});
    if (emailUser){
        errors.push({text: 'e-mail already in use!'});
    }
    if(name.length <= 0 || email.length <= 0 || password.length <= 0 || confirmPassword.length <= 0){
        errors.push({text: 'One or more fields are empty'})
    }
    if (password != confirmPassword){
        errors.push({text: 'Password does not match!'});
    }
    if (password.length < 6){
        errors.push({text: 'Password need to have at least 4 characters'});
    }
    if (errors.length > 0){
        res.render('user/signup', {errors, name, email, password, confirmPassword, layout: 'empty_page.hbs'});
    }
    else{
        const newUser = new User({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password
        });
        newUser.password = await newUser.encryptPassword(password);
        const token = randomString(n=10);
        newUser.secretToken = token
        const link = `http://localhost:3005/user/verify/${token}`;
        await newUser.save();
        await verifyEmail(email, link);
        req.flash('success_msg', 'An e-mail has been sent to ' + newUser.email + '. Verify your address before login!');
        res.redirect('/user/login');
    }
};


ctrl.verify = async(req, res) => {
    try{
        const token = req.params.token
        const user = await User.findOne({secretToken: token});
        await User.updateOne({secretToken: token}, {$set: {active: true}});
        await User.updateOne({secretToken: token}, {$unset: {secretToken: 1}});

        // Login after confirmation
        req.logIn(user, function(err) {
            if (err) {
                return next(err);
            }
            req.flash('success_msg', 'Welcome to Share Japan!');
            return res.redirect('/');
        });
    }
    catch(error){
        return res.redirect('/user/signup');
    }
}


ctrl.forgotPassword = async (req, res, next) => {
    const errors = [];
    const user = await User.findOne({email: req.body.email});  // Get the user
    if (!user){
        errors.push({text: 'No user with the specified email account.'});
    }
    if (errors.length > 0){
        res.render('user/forgot_password', {errors, layout: 'empty_page.hbs'});
    }
    else{
        // Generate a random token
        const resetToken = user.createResetPasswordToken();
        await user.save({validateBeforeSave: false});

        // Send token to the user e-mail
        const resetUrl = `http://localhost:3005/user/resetPassword/${resetToken}`;
        try{
            await sendEmail(user.email, resetUrl);
            req.flash('success_msg', 'An e-mail has been sent to your account ' + user.email + ' for password reset.');
            res.redirect("/user/forgot_password")

        } catch(error){
            user.passwordResetToken = undefined;
            user.passwordResetTokenExpire = undefined;
            user.save({validateBeforeSave: false});
            req.flash('error_msg', 'Error sending password reset e-mail. Please, try again later.');
            return next();
        }
    }
}


ctrl.resetPassword = async (req, res, next) => {
    const errors = [];
    // 1. Check if user exists
    const resetToken = crypto.createHash('sha256').update(req.params.token).digest('hex')
    const user = await User.findOne({passwordResetToken: resetToken, passwordResetTokenExpire: {$gt: Date.now()}});

    if (!user){
        errors.push({text: 'Link is not valid or has expired'});
    }
    // 2. Reset password
    if (req.body.password != req.body.confirmPassword){
        errors.push({text: 'Password does not match!'});
    }
    if (errors.length > 0){
        res.render('user/reset_password', {errors, layout: 'empty_page.hbs'});
    }
    else{
        user.password = await user.encryptPassword(req.body.password);
        // user.confirmPassword = req.body.confirmPassword;
        user.passwordResetToken = undefined;
        user.passwordResetTokenExpire = undefined;
        user.passwordChangedAt = Date.now();
        
        user.save();

        // 3. Log the user in automatically
        req.logIn(user, function(err) {
            if (err) {
                return next(err);
            }
            return res.redirect('/posts');
        });
    }
}


ctrl.login = function(req, res, next) {
    const errors = [];
    passport.authenticate('local', function(err, user, info) {
        if (err) {
            return next(err);
        }
        if (!user) {
            errors.push({text: 'Incorrect e-mail or password.'});
        }
        if (user.active === false){
            errors.push({text: 'Verify your e-mail before logging in.'});
        }
        if (user.passwordResetToken && user.passwordResetToken != undefined){
            errors.push({text: 'Verify your e-mail. You requested a password change.'});
        }
        if (errors.length > 0){
            return res.render('user/login', {errors, layout: 'empty_page.hbs'});
        } 
        if (user.active === true) {
            // Authenticate the user and maintain session
            req.logIn(user, function(err) {
                if (err) {
                    return next(err);
                }
                req.flash('success_msg', 'Welcome back!');
                return res.redirect('/');
            });
        }
        else {
            res.redirect('/user/login');
        }
    })(req, res, next);
};


ctrl.index = async (req, res) => {
    const pagination = req.query.pagination ? parseInt(req.query.pagination) : 4;
    const currentPage = req.query.page ? parseInt(req.query.page) : 1;
    
    const pagesPerSet = 5;  // Number of pages in one set
    const totalPosts = await Post.countDocuments({ user: req.user._id });
    const totalPages = Math.ceil(totalPosts / pagination);
  
    const startPage = Math.floor((currentPage - 1) / pagesPerSet) * pagesPerSet + 1;
    const endPage = Math.min(startPage + pagesPerSet - 1, totalPages);
  
    const user = await User.findOne({ _id: req.user._id });
    const savedPosts = user.posts_saved;

    let viewModel = {};

    if (savedPosts && savedPosts.length > 0) {
      // Get saved posts based on saved post IDs
      const saved_posts = await Post.find({
        _id: { $in: savedPosts }
      }).lean();

      // Get the user's posts with pagination
      const user_posts = await Post.find({ user: req.user._id })
        .skip((currentPage - 1) * pagination)
        .limit(pagination)
        .sort({ timestamp: -1 })
        .lean();

      // Loop through user posts to add user_saved and user_liked flags
      for (let i in user_posts) {
        // Check if the post is in the saved posts array
        user_posts[i].user_saved = savedPosts.includes(user_posts[i]._id.toString());

        // Check if the current user liked this post
        // Ensure correct type comparison between user._id and post likes
        user_posts[i].user_liked = user_posts[i].likes.some(like => like.toString() === req.user.id);
      }

      // Prepare the view model
      viewModel = {
        posts: user_posts,
        saved_posts: saved_posts,
        currentPage: currentPage,
        pages: getPageRange(totalPages, currentPage),  // Assuming you have this helper function
        currentTotalPages: totalPages,
        hasPreviousSet: startPage > 1,
        previousSetStart: Math.max(1, startPage - pagesPerSet),
        hasNextSet: endPage < totalPages,
        nextSetStart: Math.min(totalPages, endPage + 1),
        is_user: true,
      };
    } else {
      console.log("No saved posts for this user.");
      viewModel = {
        posts: [],  // No posts found if no saved posts
        saved_posts: [],
        currentPage: currentPage,
        pages: getPageRange(totalPages, currentPage),  // Assuming you have this helper function
        currentTotalPages: totalPages,
        hasPreviousSet: startPage > 1,
        previousSetStart: Math.max(1, startPage - pagesPerSet),
        hasNextSet: endPage < totalPages,
        nextSetStart: Math.min(totalPages, endPage + 1),
        is_user: true,
      };
    }

    // Add the sidebar data
    viewModel = await sidebar(viewModel);

    // Render the view with the view model data
    res.render('user/my_profile', {
      ...viewModel,  // Spread the viewModel so its properties are available in the template
      layout: 'profile' // Specify the custom layout name here
    });
};



ctrl.settings = async (req, res) => {
    const user  = await User.find({user: req.user._id}).lean() ;
    res.render('user/settings', user);
    };

ctrl.modify = async (req, res) => {
    try{
        const {name} =  req.body;

        const user = await User.findByIdAndUpdate(req.params.user_id, {name});
        req.flash('success_msg', 'Profile Updated Correctly!');
        res.redirect('/user/settings/');
    } catch (error) {
        res.render('error404', { layout: 'empty_page.hbs'});
    }
};

ctrl.find_user = async (req, res) => {
    const pagination = req.query.pagination ? parseInt(req.query.pagination) : 4;
    const currentPage = req.query.page ? parseInt(req.query.page) : 1;
    const startPage = Math.floor((currentPage - 1) / pagesPerSet) * pagesPerSet + 1;
    const endPage = Math.min(startPage + pagesPerSet - 1, totalPages);
    
    // Get the user by ID from params
    const writer = await User.findById({ _id: req.params.user_id });
    const author = writer.name;

    // Get posts by the author (writer)
    const posts = await Post.find({ user: writer })
        .skip((currentPage - 1) * pagination)
        .limit(pagination)
        .sort({ timestamp: -1 })
        .lean();

    const totalPosts = await Post.find({ user: writer });
    const pages = Math.ceil(totalPosts.length / pagination);
    const count = getPageRange(pages, currentPage);

    const hasPreviousSet = startPage > 1;
    const hasNextSet = endPage < totalPages;
    const previousSetStart = Math.max(1, startPage - pagesPerSet);
    const nextSetStart = Math.min(totalPages, endPage + 1);
    
    let viewModel = { posts: [] };

    // Check if the logged-in user has saved or liked posts
    const user = req.user;
    const savedPosts = user ? user.posts_saved : [];
    const likedPosts = user ? user.liked_posts : [];

    // Loop through posts to set the user_saved and user_liked flags
    for (let i in posts) {
        // Set the user_saved flag
        posts[i].user_saved = savedPosts.includes(posts[i]._id.toString());

        // Set the user_liked flag
        posts[i].user_liked = posts[i].likes.some(like => like.toString() === req.user.id);
    }

    // Prepare the view model
    viewModel.posts = posts;
    viewModel.currentPage = currentPage;
    viewModel.pages = count;
    viewModel.currentTotalPages = pages;
    viewModel.hasPreviousSet = hasPreviousSet;
    viewModel.previousSetStart = previousSetStart;
    viewModel.hasNextSet = hasNextSet;
    viewModel.nextSetStart = nextSetStart;
    viewModel.author = author;
    viewModel.is_user = false;

    // Add sidebar data
    viewModel = await sidebar(viewModel);

    // Check if the author is unknown
    if (author == "Unknown") {
        res.render('user/unknown_profile');
    } else if (req.user != null) {
        // If the logged-in user is viewing their own profile
        if (req.user.id == writer._id) {
            viewModel.is_user = true;
            res.render('user/my_profile', viewModel);
        } else {
            // If the logged-in user is viewing someone else's profile
            res.render('user/profile', viewModel);
        }
    } else {
        // Render the profile view for a guest user
        res.render('user/profile', viewModel);
    }
};


ctrl.remove = async (req, res) => {
    console.log("req.params.user_id")
    console.log(req.params.user_id)
    // try{
    const user = await User.findById({_id: req.params.user_id});
    console.log("The user is:")
    console.log(user)
    // keeping only _id and name
    user.name = "Unknown";
    user.active = false;
    user.email = undefined;
    user.password = undefined;
    user.deletedAt = Date.now();
    user.save({validateBeforeSave: false});
    if (req.isAuthenticated()) { // TODO: this seems not to work
        req.logout();
    }
    req.flash('success_msg', 'Account deleted!')
    res.redirect("/");
    // } catch (error) {
    //     res.render('error404', { layout: 'empty_page.hbs'});
    // }
};

module.exports = ctrl;