const mongoose = require('mongoose');
const { Schema } = mongoose;
const path = require('path');
const bcrypt = require('bcryptjs')

const userSchema = new Schema({
    name: {type: String },
    email: {type: String },
    password: { type: String },
    confirm_password: { type: String },
    secretToken: {type: String},
    timestamp: { type: Date, default: Date.now },
    active: { type: Boolean, default: false },
});

userSchema.methods.encryptPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    const hash = bcrypt.hash(password, salt);
    return hash;
};

userSchema.methods.matchPassword = async function (password){
    return await bcrypt.compare(password, this.password)
};

module.exports = mongoose.model('user', userSchema);