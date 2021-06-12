const express = require('express');
const routes = require('./routes');
const path = require('path');
const bodyparser = require('body-parser');
const flash = require('connect-flash');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const passport = require('./config/passport');

//importar variables
require('dotenv').config({ path: 'variables.env' });

//importar helpers
const helpers = require('./helpers');

//crear conexion a la BD
const db = require('./config/db');

//importar modelo
require('./models/Proyectos');
require('./models/Tareas');
require('./models/Usuarios');

db.sync()
    .then(() => console.log('Conectando al Servidor'))
    .catch(error => console.log(error))


//crear una app de express
const app = express();

//donde cargar los archivos estaticos
app.use(express.static('public'));

//habilitar pug
app.set('view engine', 'pug');


//agregar cookie-parser
app.use(cookieParser());

//sesiones que nos permiten navegar entre distintas paginas sin volver a autenticar
app.use(session({
    secret: 'supersecreto',
    resave: false,
    saveUninitialized: false
}));

//agregar passport
app.use(passport.initialize());
app.use(passport.session());

//agregar flash message
app.use(flash());

//pasar dump a la aplicacion
app.use((req, res, next) => {
    res.locals.vardump = helpers.vardump;
    res.locals.mensajes = req.flash();
    res.locals.usuario = {...req.user } || null;
    next();
});


//habilitar libreria bodyparser
//app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));

//const expressValidator = require('express-validator');



//añadir carpeta de las vistas
app.set('views', path.join(__dirname, './views'));



app.use('/', routes());


//servidor y puerto
const host = process.env.HOST || '0.0.0.0';
const port = process.env.PORT || 3000;

app.listen(port, host, () => {
    console.log('El servidor está funcionando');
});