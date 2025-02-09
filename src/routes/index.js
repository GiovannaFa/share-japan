const express = require('express');
const router = express.Router(); //definir URLs o rutas del servidor

const posts_list = require('../controllers/posts_list');
const post = require('../controllers/post');
const user = require('../controllers/user');
const comment = require('../controllers/comment');
const landing = require('../controllers/landing');
const { Post } = require('../models');
const { User } = require('../models');
const sidebar = require('../helpers/sidebar');
const crypto = require('crypto');

module.exports = app => {
    // landing page related endpoints
    router.get('/', (req, res) => {
        res.render('index', { layout: 'landing.hbs'});
    });
    router.get('/select/:prefecture', landing.find_count);

    // about related endpoint
    router.get('/about', (req, res) => {
        res.render('about', { layout: 'empty_page.hbs'});
    });
    
    // list of posts related endpoints
    router.get('/posts', posts_list.index);
    router.get('/topic/:about', posts_list.find_about);
    router.get('/city/:prefecture/:city', posts_list.find_city);
    router.get('/prefecture/:prefecture', posts_list.find_prefecture);
    router.get('/select/:prefecture/:about', posts_list.find_prefecture_and_about);
    router.get('/select/:prefecture/:city/:about', posts_list.find_city_and_about);
    
    // post related endppoints
    router.get('/posts/:post_id', post.index);
    router.post('/posts', post.create);
    router.post('/posts/:post_id/like', post.like);
    router.post('/posts/:post_id', comment.create);
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

    // user related endpoints
    router.get('/user/signup', (req,res) => {
        res.render('user/signup', { layout: 'empty_page.hbs'});
    });
    router.post('/user/signup', user.signup);
    router.get('/user/verify/:token', user.verify);
    router.get('/user/login', (req,res) => {
        res.render('user/login', { layout: 'empty_page.hbs'});
    });
    router.post('/user/login', user.login);
    router.post('/user/forgotPassword', user.forgotPassword);
    router.get('/user/forgot_password', (req, res) => {
        res.render('user/forgot_password', { layout: 'empty_page.hbs'});
    });
    router.patch('/user/resetPassword/:token', user.resetPassword);
    router.get('/user/resetPassword/:token', async (req, res) => {
        const resetToken = crypto.createHash('sha256').update(req.params.token).digest('hex')
        const user = await User.findOne({passwordResetToken: resetToken}).lean();
        user.originalSecretToken = req.params.token
        res.render('user/reset_password', {user, layout: 'empty_page.hbs'});
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