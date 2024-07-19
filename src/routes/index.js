const express = require('express');
const router = express.Router(); //definir URLs o rutas del servidor

const posts_list = require('../controllers/posts_list');
const post = require('../controllers/post');
const user = require('../controllers/user');
const landing = require('../controllers/landing');
const { Post } = require('../models');
const { User } = require('../models');
const sidebar = require('../helpers/sidebar');
//var ObjectId = require('mongoose').Types.ObjectId;
//const { isAuthenticated } = require('../helpers/auth');
const crypto = require('crypto');

module.exports = app => {
    router.get('/', (req, res) => {
        res.render('index', { layout: 'landing_page.hbs'});
    });
    router.get('/select/:city', landing.find_count);
    router.get('/posts', posts_list.index);
    router.get('/city/:city', posts_list.find_where);
    router.get('/topic/:about', posts_list.find_about);
    router.get('/select/:city/:topic', posts_list.find_where_about);
    router.get('/posts/:post_id', post.index);
    router.post('/posts', post.create);
    router.post('/posts/:post_id/like', post.like);
    //router.post('/posts/:post_id/comment', post.comment);
    router.delete('/posts/:post_id', post.remove);

    router.get('/posts/edit/:post_id', async (req, res) => {
        const post = await Post.findById({_id: req.params.post_id}).lean();
        res.render('edit-form', {post});
    })
    router.put('/edit-form/:post_id', post.modify);

    router.get('/form', async (req, res) => {
        const posts  = await Post.find().lean() ;
        let viewModel = { posts: [] };
        viewModel.posts = posts;
        viewModel = await sidebar(viewModel);
        res.render('form', viewModel);
    });
    router.get('/about', (req, res) => {
        res.render('about', { layout: 'post_main.hbs'});
    });

    router.get('/user/signup', (req,res) => {
        res.render('user/signup', { layout: 'post_main.hbs'});
    });
    router.post('/user/signup', user.signup);
    
    router.get('/user/verify/:token', user.verify);

    router.get('/user/login', (req,res) => {
        res.render('user/login', { layout: 'post_main.hbs'});
    });
    router.post('/user/login', user.login);
    
    router.post('/user/forgotPassword', user.forgotPassword);
    router.get('/user/forgot_password', (req, res) => {
        res.render('user/forgot_password', { layout: 'post_main.hbs'});
    });

    router.patch('/user/resetPassword/:token', user.resetPassword);
    router.get('/user/resetPassword/:token', async (req, res) => {
        const resetToken = crypto.createHash('sha256').update(req.params.token).digest('hex')
        const user = await User.findOne({passwordResetToken: resetToken}).lean();
        user.originalSecretToken = req.params.token
        res.render('user/reset_password', {user, layout: 'post_main.hbs'});
    })
    
    router.get('/user/settings', user.settings);
    router.put('/user/settings/:user_id', user.modify);
    router.get('/user/logout', (req, res) => {
        req.logout();
        req.flash('success_msg', 'Logged out!');
        res.redirect('/');
    });

    router.delete('/user/:user_id', user.remove);

    router.get('/user/profile', user.index);
    router.get('/user/profile/:user_id', user.find_user);

    app.use(router);
};