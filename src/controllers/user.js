const { User }  = require('../models');
const { Post }  = require('../models');
const passport = require('passport');
const sidebar = require('../helpers/sidebar');
const {randomString} = require("../helpers/libs");
var ObjectId = require('mongoose').Types.ObjectId;
// const { write } = require('fs-extra');
const { verifyEmail } = require('../helpers/auth');
const { sendEmail } = require('../helpers/auth');
// const helpers = require('../helpers/libs');
const crypto = require('crypto');
require('../server/passport');
const ctrl = {};
ctrl.signup = async (req, res) => {
    const { name, email, password, confirmPassword }  = req.body;
    const errors = [];
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
        res.render('user/signup', {errors, name, email, password, confirmPassword, layout: 'post_main.hbs'});
    }
    else{
        const emailUser = await User.findOne({email:email});
        if (emailUser){
            req.flash('error_msg', 'Email already in use');
            return res.redirect('/user/signup');
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
        };
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
        res.render('user/forgot_password', {errors, layout: 'post_main.hbs'});
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
        res.render('user/reset_password', {errors, layout: 'post_main.hbs'});
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
            return res.render('user/login', {errors, layout: 'post_main.hbs'});
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
    const user_posts  = await Post.find({user: req.user._id}).sort({timestamp: -1}).lean() ;
    let viewModel = { posts: [] };
    viewModel.posts = user_posts
    viewModel = await sidebar(viewModel);
    res.render('user/my_profile', viewModel);
    };

ctrl.find_user = async (req, res) => {
    //return posts from this author
    const writer = await User.findById({_id: req.params.user_id});
    const author = writer.name;
    const posts = await Post.find({user: req.params.user_id}).sort({timestamp: -1}).lean();
    let viewModel = { posts: [] };
    viewModel.posts = posts;
    viewModel.author = author;
    viewModel = await sidebar(viewModel);
    if (req.user != null){
        if (req.user.id == writer._id){
            res.render('user/my_profile', viewModel);
        }
        else{
            res.render('user/profile', viewModel);
            }
    }
    else{
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
    //     res.render('error404', { layout: 'post_main.hbs'});
    // }
};

module.exports = ctrl;