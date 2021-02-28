const mongoose = require('mongoose');
const { Schema } = mongoose;
const path = require('path');

const postSchema = new Schema({
    where: {type: String },
    about: {type: String },
    title: { type: String },
    description: { type: String },
    filename: { type: String },
    likes: [{type: mongoose.Schema.ObjectId, ref:"User"}],
    views: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now },
    user: {type: mongoose.Schema.ObjectId}
});

postSchema.virtual('uniqueId')
    .get(function(){
        return this.filename.replace(path.extname(this.filename))
    })

module.exports = mongoose.model('post', postSchema);