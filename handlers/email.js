const nodemailer = require('nodemailer');
const pug = require('pug');
const juice = require('juice');
const { htmlToText } = require('html-to-text');
//const htmlToText = require('html-to-text');
const util = require('util');
const emailConfig = require('../config/email');


//crear transporte
let transport = nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    auth: {
        user: emailConfig.user,
        pass: emailConfig.pass
    }
});



const generarHTML = (archivo, opciones = {}) => {
    const html = pug.renderFile(`${__dirname}/../views/emails/${archivo}.pug`, opciones);
    return juice(html);

};


const text = htmlToText('<h1>Hello World</h1>', {
    wordwrap: 130
});

exports.enviar = async(opciones) => {
    const html = generarHTML(opciones.archivo, opciones);
    const text = htmlToText(html, {
        wordwrap: 130
    });
    //    const text = htmlToText.fromString(html);
    let opcionesEmail = {
        from: 'UpTask <noreply@uptask.com>',
        to: opciones.usuario.email,
        subject: opciones.subject,
        text,
        html
    };

    const enviarEmail = util.promisify(transport.sendMail, transport);
    return enviarEmail.call(transport, opcionesEmail);

};