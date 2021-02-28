const { User }  = require('../models');
const { Post }  = require('../models');
const passport = require('passport');
const sidebar = require('../helpers/sidebar');
var ObjectId = require('mongoose').Types.ObjectId;
const { write } = require('fs-extra');
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
            await newUser.save();
            req.flash('success_msg', 'Welcome to Share Japan! \n You can now leave your review :)');
            passport.authenticate('local')(req, res, function () {
                res.redirect('/user/profile');
            })
        };
    }
};

ctrl.login = passport.authenticate('local', {
    successRedirect: '/posts',
    failureRedirect: '/user/login',
    failureFlash: true
});

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