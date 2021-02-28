const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const { User } = require('../models');

passport.use(new LocalStrategy({
    usernameField: 'email'
}, async (email, password, done) => {
    const user = await User.findOne({email:email});
    if (!user){
        return done(null, false, { message: 'User not found' });
    } else{
        const match = await user.matchPassword(password);
        if(match){
            return done (null, user);
        } else{
            return done (null, false, { message : 'incorrect password' });
        }
    }
}));

passport.serializeUser((user, done) => {
    done(null,user.id); //par guardar los datos de usuario durante toda la nevigación
});

passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        done(err, user);
    });
});