const mongoose = require('mongoose');
const { Schema } = mongoose;
const path = require('path');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new Schema({
    name: {type: String },
    email: {type: String },
    password: { type: String },
    confirmPassword: { type: String },
    passwordChangedAt: { type: Date},
    originalSecretToken: {type: String},
    secretToken: {type: String},
    passwordResetToken: {type: String},
    passwordResetTokenExpire: {type: Date},
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

userSchema.methods.createResetPasswordToken = function(){
    const resetToken  = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetTokenExpire = Date.now() + 10 * 60 * 1000;

    console.log(resetToken, this.passwordResetToken);

    return resetToken;
}

module.exports = mongoose.model('user', userSchema);