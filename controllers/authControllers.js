const passport = require('passport');
const Usuarios = require('../models/Usuarios');
const sequelize = require('sequelize');
const crypto = require('crypto');
const Op = sequelize.Op;
const bcrypt = require('bcrypt-nodejs');
const enviarEmail = require('../handlers/email');


exports.autenticarUsuario = passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/iniciar-sesion',
    failureFlash: true,
    badRepuestMessage: 'Ambos campos son obligatorios'
});

//funcion para revisar si el usuario esta logueado o no
exports.usuarioAutenticado = (req, res, next) => {
    //si el usuario esta autenticado seguir
    if (req.isAuthenticated()) {
        return next();
    }
    //si no esta autenticado, redirigir al formulario
    return res.redirect('/iniciar-sesion');
}

//funcion para cerrar sesion
exports.cerrarSesion = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/iniciar-sesion');
    })
}

//generar un token
exports.enviarToken = async(req, res) => {
    //verificar q el usuario existe
    const { email } = req.body;
    const usuario = await Usuarios.findOne({ where: { email } });

    //si no existe el usuario
    if (!usuario) {
        req.flash('error', 'No existe esa cuenta');

        //todo esto se puede reemplazar
        //res.render('restablecer', {
        //    nombrePagina: 'Restablecer tu contraseña'
        //    mensajes = req.flash()
        //})

        //por
        res.redirect('/restablecer');
    }

    //usuario existe
    usuario.token = crypto.randomBytes(20).toString('hex');
    usuario.expiracion = Date.now() + 36000000;

    //guardar en BD
    await usuario.save();

    //url de reset
    const resetUrl = `http://${req.headers.host}/restablecer/${usuario.token}`;
    //enviar el correo con el Token
    await enviarEmail.enviar({
        usuario,
        subject: 'Password Reset',
        resetUrl,
        archivo: 'restablecer-password'
    });
    //terminar
    req.flash('correcto', 'Se envió un mensaje a tu correo');
    res.redirect('/iniciar-sesion');

}

exports.validarToken = async(req, res) => {
    const usuario = await Usuarios.findOne({
        where: {
            token: req.params.token
        }
    });
    //si no se encuentra el usuario
    if (!usuario) {
        req.flash('error', 'No válido');
        res.redirect('/restablecer');
    }
    //formulario para generar el password
    res.render('resetPassword', {
        nombrePagina: 'Restablecer Contraseña'
    })
}

//cambia password por uno nuevo
exports.autorizarPassword = async(req, res) => {
    const usuario = await Usuarios.findOne({
        where: {
            token: req.params.token,
            expiracion: {
                [Op.gte]: Date.now()
            }
        }
    });
    //verificar si el usuario existe
    if (!usuario) {
        req.flash('error', 'No válido');
        res.redirect('/restablecer');
    }
    //hashear el nuevo password
    usuario.password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10));
    usuario.token = null;
    usuario.expiracion = null;

    //guardamos nuevo password
    await usuario.save();

    res.redirect('/iniciar-sesion');

}