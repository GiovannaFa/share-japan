const path = require('path');
const exphbs = require("express-handlebars");
const morgan = require('morgan');
const multer = require('multer');
const express = require('express');
const methodOvveride = require('method-override');
const errorHandler = require('errorhandler');
const routes = require('../routes/index');

const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
require('./passport');

//aquí configuramos todo lo necesario con Express
module.exports = app => {

    //Settings
    app.set('port', process.env.PORT || '3005');
    app.set('views', path.join(__dirname, '../views')); //establecer donde views (__dirname returns path to src)
    //***************//
    //definición de handlebars, el motor de plantillas - exphbs define que motor
    app.engine('.hbs', exphbs({
        defaultLayout: 'main', //página principal
        partialsDir: path.join(app.get('views'), 'partials'),
        layoutsDir: path.join(app.get('views'), 'layouts'),
        extname: '.hbs',
        helpers: require("./helpers")
    }));
    app.set('view engine', '.hbs');
    //***************//
    //middlewares
    app.use(morgan('dev'))
    //cuando se suba una imagen, colócala en una carpeta temp, dentro de upload, dentro de public
    app.use(multer({dest: path.join(__dirname, '../public/upload/temp')}).single('image'));
    //para recibir datos que vienen de formularios HTML:
    app.use(express.urlencoded({extended: false}))
    app.use(methodOvveride('_method')); //para enviar PUT DELETE...
    //para manejar los likes, ya que vienen e json de peticiones http a través de ajax
    app.use(express.json());
    //***************//

    app.use(session({
        secret: 'mysecretapp',
        resave: true,
        saveUninitialize: true
    }));

    app.use(passport.initialize());
    app.use(passport.session());
    app.use(flash());

    //Global Variables
    app.use((req,res, next) => {
        res.locals.success_msg= req.flash("success_msg");
        res.locals.error_msg= req.flash("error_msg");
        res.locals.error= req.flash("error");
        res.locals.user= req.user || null;
        next();
    });

    //routes
    routes(app);

    //static files
    app.use('/public', express.static(path.join(__dirname, '../public')));

    //error handlerds
    if ('development' === app.get('env')){
        app.use(errorHandler);
    }

    return app;
}