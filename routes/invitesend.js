"use strict";

const express = require('express');
const app = express();
const sgMail = require('@sendgrid/mail');
const config = require("../db/config.json");

app.post("/invitesend", async function(req, res) {

    const recipient = req.body.recipient;
    const inviterName = req.body.inviterName;
    const inviterEmail   = req.body.inviterEmail;
    const filename   = req.body.filename;
    const title   = req.body.title;

    let emailContentHtml = `
    <h3>CirrusDocs</h3>

    <p>Hi there! <strong>${inviterName}</strong> has just invited you to
    join in editing their document "${filename}" at CirrusDocs – your new
    favourite collaborative cloud editor service.</p>
    <p>Simply follow this link, register using this e-mail
    address, and open "${filename}" to start editing:</p>
    <a href="https://www.student.bth.se/~riax20/editor/">Click here</a>
    <br><br>
    <i>Your CirrusDocs team</i>
    `;

    const msg = {
        to: recipient,
        from: 'riax20@student.bth.se',
        subject: `CirrusDocs: ${inviterName} has invited you to edit "${filename}"`,
        html: emailContentHtml
    };

    // using Twilio SendGrid's v3 Node.js Library
    // https://github.com/sendgrid/sendgrid-nodejs
    sgMail.setApiKey(config.sendgridsecret);

    sgMail
        .send(msg)
        .catch((error) => {
            console.error(error);
        });

    res.status(202).send(true);
});

module.exports = app;
