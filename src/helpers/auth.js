const nodeMailer = require('nodemailer');

const helpers = {};

helpers.isAuthenticated = (req, res, next) => {
    if(req.isAuthenticated()){
        return next();
    }
    req.flash('error_msg', 'Not authorized');
    res.redirect('/user/login');
};

helpers.verifyEmail = async (req, res) => {
    let transporter = nodeMailer.createTransport({
        service: "gmail",
        auth: {
            user: "giovannaa.favia@gmail.com",
            pass: "pwnsrtqozvthgzjf",

        }
    });
    let info = await transporter.sendMail({
        from: "giovannaa.favia@gmail.com",
        to: req,
        subject: "Welcome to Share Japan!",
        text: "Welcome",
        html: `
            <div>
                <h3>Thank you for registering.</h3>
                <p>Click <a href=${res}>here</a> to verify your account.</p>
            </div>
        `
    });    
}

helpers.sendEmail = async  (req, res) => {
    let transporter = nodeMailer.createTransport({
        service: "gmail",
        auth: {
            user: "giovannaa.favia@gmail.com",
            pass: "pwnsrtqozvthgzjf",

        }
    });
    let emailOptions = await transporter.sendMail({
        from: process.env.USER,
        to: req,
        text: "Password Change",
        html: `
            <div>
                <h3>You have requested a password change</h3>
                <p>Click <a href=${res}>here</a> to update your e-mail.</p>
            </div>
        `,
    });
};

module.exports = helpers;