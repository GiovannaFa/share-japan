const path = require('path');
const {randomString} = require("../helpers/libs");
const fs = require('fs-extra')
const { Post } = require('../models');
const sidebar = require('../helpers/sidebar');
const { exec } = require('child_process');
//const { runInNewContext } = require('vm');
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
            res.render('error404', { layout: 'pages.hbs'});
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
            is_user = false;
            if (post.likes.length >= 1) {
                for (let x in post.likes){
                    if (post.likes[x] == req.user.id)
                        is_user = true;
                    else{
                        is_user = false;
                    }
                }
            }
            let viewModel = { post: [] };
            viewModel.post = post;
            viewModel.author = author;
            viewModel.is_user = is_user;
            viewModel = await sidebar(viewModel);
            res.render('edit-form', viewModel);
            }
        catch (error) {
            res.render('error404', { layout: 'pages.hbs' });
        }
    }
};


ctrl.create = async (req, res) => {

        const generateUniqueImageUrl = (existingFilenames) => {
            let newImageUrl;
            const generate = () => {
                newImageUrl = randomString(6);
                if (existingFilenames.includes(newImageUrl)) {
                    return generate(); // Recursively generate a new string if there’s a duplicate
                }
                return newImageUrl;
            };
            return generate();
        };

        const user_id = req.user._id;
        const custom_dir = path.resolve(`src/public/upload/${user_id}`);
        if (!fs.existsSync(custom_dir)) {
            fs.mkdirSync(custom_dir);
        }
        try {
            const filenames = [];
            for (const file of req.files) {
                const imageTempPath = file.path;
                const ext = path.extname(file.originalname).toLowerCase();
                const imageUrl = generateUniqueImageUrl(filenames);
                const targetPath = path.resolve(`src/public/upload/${user_id}/${imageUrl}${ext}`);

                if (['.png', '.jpg', '.jpeg', '.gif', '.mp4'].includes(ext)) {
                    await fs.promises.rename(imageTempPath, targetPath);
                    filenames.push(imageUrl + ext);
                } else {
                    await fs.promises.unlink(imageTempPath);
                    return res.status(500).json({ error: 'Only images and videos are allowed' });
                }
            }
            console.log(`filenames is: ${filenames}`)
            const newPost = new Post({
                where: req.body.where,
                about: req.body.about,
                title: req.body.title,
                description: req.body.description,
                filenames: filenames,
            });
            newPost.user = req.user.id;
            await newPost.save();
            await fs.rename(custom_dir, `src/public/upload/${newPost._id}`);
            res.redirect('/posts/' + newPost._id);
        }
        catch (error) {
            // Error handling, e.g., logging
            console.error('Error uploading post', error);
            res.render('error404', { layout: 'pages.hbs' });
        }
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
        await fs.unlink(path.resolve(`./src/public/upload/${post._id}` + post.filename)); //remove the image from upload folder
        res.redirect("/user/profile");
    } catch (error) {
        res.render('error404', { layout: 'pages.hbs'});
    }
};

ctrl.modify = async (req, res) => {
    try{
        const {where, about, title, description} =  req.body;

        const post = await Post.findByIdAndUpdate(req.params.post_id, {where, about, title, description});
        req.flash('success_msg', 'Post Updated Correctly!');
        res.redirect('/posts/'+post._id);
    } catch (error) {
        res.render('error404', { layout: 'pages.hbs'});
    }
};

module.exports = ctrl;