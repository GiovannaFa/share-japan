const path = require('path');
const {generateUniqueImageUrl} = require("../helpers/libs");
const fs = require('fs-extra')
const { Post } = require('../models');
const sidebar = require('../helpers/sidebar');
var ObjectId = require('mongoose').Types.ObjectId;
const ctrl = {};

ctrl.index = async (req, res) => {
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
    const comments = await Post.aggregate([
        {
          $match: { _id: new ObjectId(req.params.post_id) }
        },
        {
          $lookup: {
            from: "comments",
            localField: "_id",
            foreignField: "post_id",
            as: "users_comments"
          }
        },
        {
          $unwind: "$users_comments" // Flatten the array of comments
        },
        {
          $sort: { "users_comments.timestamp": -1 } // Sort by timestamp (most recent first)
        },
        {
          $group: {
            _id: "$_id",
            users_comments: { $push: "$users_comments" } // Rebuild the comments array
          }
        }
      ]);
    const users_comments = comments.length > 0 ? comments[0].users_comments : [];
    const post = await Post.findOneAndUpdate({_id: req.params.post_id}, { $inc: { views: 1 }}).lean();
    try{
        let viewModel = { post: [] };
        viewModel.post = post;
        viewModel.author = author;
        viewModel.comments = users_comments;
        viewModel = await sidebar(viewModel);
        res.render('post', { ...viewModel, layout: 'post.hbs' });
    } catch (error) {
        res.render('error404', {layout: 'empty_page.hbs'});
    }
};


ctrl.create = async (req, res) => {
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
            where: {
                city: req.body.city,
                prefecture: req.body.prefecture
            },
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
        res.render('error404', { layout: 'empty_page.hbs' });
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


ctrl.remove = async (req, res) => {
    try {
        const post = await Post.findOneAndRemove({ _id: req.params.post_id }).lean();

        const folderPath = path.resolve(`./src/public/upload/${post._id}`);
        if (fs.existsSync(folderPath)) {
            fs.remove(folderPath, { recursive: true });
            console.log(`Folder ${folderPath} deleted successfully.`);
            req.flash('success_msg', 'Post deleted Correctly!');
        } else {
            console.log(`Folder ${folderPath} does not exist.`);
        }
    
        res.redirect("/user/profile");
    } catch (error) {
        console.error('Error during folder deletion:', error);
        res.render('error404', { layout: 'empty_page.hbs' });
    }
    
};

ctrl.modify = async (req, res) => {
    try {
        const { city, prefecture, about, title, description } = req.body;
        const postId = req.params.post_id;

        // Get the current post
        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).render('error404', { layout: 'empty_page.hbs' });
        }
        
        let existingFiles = post.filenames || [];
        if (req.files){
            // Handle new files (uploaded via form)
            for (const file of req.files) {
                const imageTempPath = file.path;
                const ext = path.extname(file.originalname).toLowerCase();
                const imageUrl = generateUniqueImageUrl(existingFiles);
                const targetPath = path.resolve(`src/public/upload/${postId}/${imageUrl}${ext}`);
                await fs.promises.rename(imageTempPath, targetPath);
                existingFiles.push(imageUrl + ext);
            }
        }
        
        // Handle deletions (get filenames to delete)
        if (req.body.deleteFiles && req.body.deleteFiles.length > 0) {
            const filesToDelete = req.body.deleteFiles.split(',');
            existingFiles = existingFiles.filter(file => !filesToDelete.includes(file));

            // Remove files from filesystem
            filesToDelete.forEach(file => {
                const filePath = path.join(__dirname, '../public/upload/', postId, file);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath); // Remove file from filesystem
                }
            });
        }

        // Update the post
        post.where.city = city,
        post.where.prefecture = prefecture,
        post.about = about;
        post.title = title;
        post.description = description;
        post.filenames = existingFiles; // Updated filenames list

        console.log(post)
        // Save the post
        await post.save();

        req.flash('success_msg', 'Post Updated Correctly!');
        res.redirect('/posts/' + post._id);
    } catch (error) {
        console.error(error);
        res.render('error404', { layout: 'empty_page.hbs' });
    }
};

module.exports = ctrl;