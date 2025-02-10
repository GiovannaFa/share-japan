const ctrl = {};
const { Comment } = require('../models');
const { ObjectId } = require('mongodb');

ctrl.create = async (req, res) => {
    console.log('Request Body:', req.body);
    console.log('Request Params:', req.params);
    console.log('Request Query:', req.query);
    console.log('Request User:', req.user);
    postId = req.params.post_id
    if (req.user){
        try{
            const newComment = new Comment({
                comment: req.body.comment,
            });
            newComment.user_id = req.user._id;
            newComment.user_name = req.user.name;
            newComment.post_id = postId;
            await newComment.save();
            
            res.redirect('/posts/' + postId);
        }
        catch (error) {
            console.error('Error uploading comment', error);
            res.render('error404', { layout: 'empty_page.hbs' });
        } 
    }
    else{
        res.redirect('/user/login');
    }
    
};

ctrl.remove = async (req, res) => {
    postId = req.params.post_id
    commentId = req.params.comment_id
    
    if(req.user){
        const loggedInUser = req.user._id;
        const comment = await Comment.findById({_id: commentId});
        const commenter = comment.user_id;
        if(commenter.equals(loggedInUser)){
            try {
                const comment = await Comment.findOneAndRemove({ _id: req.params.comment_id }).lean();
                    req.flash('success_msg', 'Comment deleted!');
            } catch (error) {
                console.error('Error during folder deletion:', error);
                res.render('error404', { layout: 'empty_page.hbs' });
            }
        }
        else{
            console.error("User logged and author of the post don't match");
        }
    }
    else{
        console.error("No user logged!");
    }
    res.redirect('/posts/' + postId);
};

// ctrl.modify = async (req, res) => {
    // console.log('Request Body:', req.body);
    // console.log('Request Params:', req.params);
    // console.log('Request Query:', req.query);
    // console.log('Request User:', req.user);
//     if (req.user){
//         const loggedUser = req.user._id;
//         const comment = await Comment.findById({_id: commentId});
//         const commenter = comment.user_id;
//         if(commenter.equals(loggedUser)){
//             try {
//                 const { comment } = req.body;
//                 const commentId = req.params.comment_id;
//                 const postId = req.params.post_id;
        
//                 const update_comment = await Comment.findById(commentId);
                
//                 update_comment.comment = comment
//                 console.log(update_comment)
//                 // Save the post
//                 await update_comment.save();
        
//                 req.flash('success_msg', 'Comment Updated Correctly!');
//                 res.redirect('/posts/' + postId);
//             } catch (error) {
//                 console.error(error);
//                 res.render('error404', { layout: 'empty_page.hbs' });
//             }
//         }
//         else{
//             console.log("User logged and author of the post don't match")
//         }
//     }
//     else{
//         console.error("No user logged!")
//     }
// };

module.exports = ctrl;