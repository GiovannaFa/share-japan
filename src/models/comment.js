const mongoose = require('mongoose');
const { Schema } = mongoose;

const commentSchema = new Schema({
    user_id: { type: mongoose.Schema.ObjectId },
    user_name: { type: String },
    post_id: { type: mongoose.Schema.ObjectId },
    comment: { type: String },
    timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('comment', commentSchema);