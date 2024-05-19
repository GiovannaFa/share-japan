const { User }  = require('../models');
const { Post }  = require('../models');
const passport = require('passport');
const sidebar = require('../helpers/sidebar');
const {randomString} = require("../helpers/libs");
var ObjectId = require('mongoose').Types.ObjectId;
const { write } = require('fs-extra');
const { verifyemail } = require('../helpers/auth');
require('../server/passport');
const ctrl = {};
ctrl.signup = async (req, res) => {
    const { name, email, password, confirm_password }  = req.body;
    const errors = [];
    if(name.length <= 0 || email.length <= 0 || password.length <= 0 || confirm_password.length <= 0){
        errors.push({text: 'One or more fields are empty'})
    }
    if (password != confirm_password){
        errors.push({text: 'Password does not match!'});
    }
    if (password.length < 6){
        errors.push({text: 'Password need to have at least 4 characters'});
    }
    if (errors.length > 0){
        res.render('user/signup', {errors, name, email, password, confirm_password});
    }
    else{
        const emailUser = await User.findOne({email:email});
        if (emailUser){
            req.flash('error_msg', 'Email already in use');
            res.redirect('/user/signup');
        }
        else{
            const newUser = new User({
                name: req.body.name,
                email: req.body.email,
                password: req.body.password
            });
            newUser.password = await newUser.encryptPassword(password);
            const token = randomString();
            newUser.secretToken = token
            const link = `http://localhost:3005/user/verify/${token}`;
            await newUser.save();
            await verifyemail(email, link);
            req.flash('success_msg', 'An e-mail has been sent, verify your address before login!');
            res.redirect('/user/login');
        };
    }
};


ctrl.verify = async(req, res) => {
    try{
        const token = req.params.token
        console.log("token: " + token);
        await User.updateOne({secretToken: token}, {$set: {active: true}});
        return res.redirect('/user/login');
    }
    catch(error){
        return res.redirect('/user/signup');
    }
    
}

ctrl.login = function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
        if (err) {
            return next(err);
        }
        if (!user) { 
            return res.redirect('/user/signup');
        }
        if (user.active === true) {
            // Authenticate the user and maintain session
            req.logIn(user, function(err) {
                if (err) {
                    return next(err);
                }
                return res.redirect('/posts');
            });
        } else {
            req.flash('error_msg', 'Verify your e-mail before logging in.')
            return res.redirect('/user/login');
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

module.exports = ctrl;