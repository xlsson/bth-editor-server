"use strict";

const express = require('express');
const app = express();
const sgMail = require('@sendgrid/mail');

if (process.env.NODE_ENV === 'test') {
    let config = require("../db/githubconfig.json");
} else {
    let config = require("../db/config.json");
}

app.post("/sendinvite", async function(req, res) {

    const recipient = req.body.recipient;
    const inviterName = req.body.inviterName;
    const inviterEmail   = req.body.inviterEmail;
    const filename   = req.body.filename;
    const title   = req.body.title;

    let emailContentHtml = `
    <p>Hi there!</p>
    <p><strong>${inviterName}</strong> (${inviterEmail}) has invited
    you to join in editing their document "${filename}" ("${title}") at CirrusDocs –
    your new favourite collaborative online word processor.</p>

    <p>Simply follow this link, register using this e-mail
    address, and open "${filename}" to start editing:</p>
    <a href="https://www.student.bth.se/~riax20/editor/">Click here</a>
    <br><br>
    <i>Your CirrusDocs team</i>
    `;

    const msg = {
        to: recipient,
        from: 'riax20@student.bth.se',
        subject: `CirrusDocs – invitation to edit from ${inviterName}`,
        html: emailContentHtml
    };

    let result = {
        inviteSent: true
    };

    // using Twilio SendGrid's v3 Node.js Library
    // https://github.com/sendgrid/sendgrid-nodejs
    sgMail.setApiKey(config.sendgridsecret);

    sgMail
        .send(msg)
        .catch((error) => {
            console.error(error);
            result.inviteSent = false;
        });

    res.status(202).json(result);
});

module.exports = app;
