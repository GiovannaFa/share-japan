const path = require('path');
const {randomString} = require("../helpers/libs");
const fs = require('fs-extra')
const { Post } = require('../models');
const sidebar = require('../helpers/sidebar');
const { runInNewContext } = require('vm');
var ObjectId = require('mongoose').Types.ObjectId;
//controlador: objeto con funciones
const ctrl = {};

ctrl.index = async (req, res) => {
    if (req.user == undefined){
        try{
            const writer = await Post.aggregate([{
                $match:{_id: new ObjectId(req.params.post_id)}},
                {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "usuario"}
                }
                ]);
            const author = writer[0].usuario[0];

            const post = await Post.findOneAndUpdate({_id: req.params.post_id}, { $inc: { views: 1 }}).lean();
            let viewModel = { post: [] };
            viewModel.post = post;
            viewModel.author = author;
            viewModel = await sidebar(viewModel);
            res.render('post', viewModel);
        } catch (error) {
            res.render('error404', { layout: 'post_main.hbs'});
        }
    }
    else{
        try{
            const writer = await Post.aggregate([{
                $match:{_id: new ObjectId(req.params.post_id)}},
                {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "usuario"}
                }
                ]);
            const author = writer[0].usuario[0];

            const post = await Post.findOneAndUpdate({_id: req.params.post_id}, { $inc: { views: 1 }}).lean();
            for (let x in post.likes){
                if (post.likes[x] == req.user.id)
                    is_user = true;
                else{
                    is_user = false;
                }
            }
            let viewModel = { post: [] };
            viewModel.post = post;
            viewModel.author = author;
            viewModel.is_user = is_user;
            viewModel = await sidebar(viewModel);
            res.render('post', viewModel);
            }
        catch (error) {
            res.render('error404', { layout: 'post_main.hbs'});
        }
    }
};

ctrl.create = (req, res) => {
    const savePost = async () => {
        const imageUrl = randomString(n=6);
        const images = await Post.find({filename: imageUrl});
        if (images.length > 0){
            savePost();
        }
        else {
            const imageTempPath = req.file.path;
            const ext = path.extname(req.file.originalname).toLowerCase();
            const targetPath = path.resolve(`src/public/upload/${imageUrl}${ext}`)

            if (ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.gif'){
                await fs.rename(imageTempPath, targetPath);
                const newPost = new Post({
                    where: req.body.where,
                    about: req.body.about,
                    title: req.body.title,
                    description: req.body.description,
                    filename: imageUrl + ext,
                });
                newPost.user = req.user.id;
                await newPost.save();
                res.redirect('/posts/'+ newPost._id);
            }
            else {
                await fs.unlink(imageTempPath);
                res.status(500).json({error: 'Sorry, only images can be uploaded'})
            }
        }
    };
    savePost();
};

ctrl.like = async (req, res) => {
    const post = await Post.findById({_id: req.params.post_id});
    if (post) {
        if (post.likes.includes(req.user.id)){
            post.likes.pull(req.user.id);
            post.save();
            res.json({likes: post.likes.length});
        }
        else{
            post.likes.push(req.user.id);
            var arr = post.likes.filter((like, index)=>post.likes.indexOf(like) === index);
            post.likes = arr;
            post.save();
            res.json({likes: post.likes.length});
        }
    } else {
      res.status(500).json({error: 'Internal Error'});
    }
  };

/* ctrl.comment = (req, res) => {

}; */

ctrl.remove = async (req, res) => {
    try{
        const post = await Post.findOneAndRemove({_id: req.params.post_id}).lean();
        await fs.unlink(path.resolve('./src/public/upload/' + post.filename));//remove the image from upload folder
        res.redirect("/user/profile");
    } catch (error) {
        res.status(500).json({error: "Error occurred"});
    }
};

ctrl.modify = async (req, res) => {
    try{
        const {where, about, title, description} =  req.body;

        const post = await Post.findByIdAndUpdate(req.params.post_id, {where, about, title, description});
        req.flash('success_msg', 'Post Updated Correctly!');
        res.redirect('/posts/'+post._id);
    } catch (error) {
        res.status(500).json({error: "Error occurred"});
    }
};

module.exports = ctrl;