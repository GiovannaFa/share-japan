const ctrl = {};
const { Comment } = require('../models');

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
    try {
        const comment = await Comment.findOneAndRemove({ _id: req.params.comment_id }).lean();
        console.log(comment);
            req.flash('success_msg', 'Comment deleted!');
        res.redirect("/user/profile");
    } catch (error) {
        console.error('Error during folder deletion:', error);
        res.render('error404', { layout: 'empty_page.hbs' });
    }
    
};

module.exports = ctrl;