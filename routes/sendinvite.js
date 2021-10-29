/**
 * @fileOverview Update the array of users allowed to edit, and send an
 * invitation e-mail using SendGrid.
 * @author - xlsson
 */

"use strict";

const express = require('express');
const app = express();
const sgMail = require('@sendgrid/mail');

if (process.env.NODE_ENV === 'test') {
    let config = require("../db/testconfig.json");
} else {
    let config = require("../db/config.json");
}

/**
 * Update the array of users allowed to edit, and send an invitation e-mail
 * using SendGrid.
 *
 * @async
 *
 * @param {object} req                   Request object, consisting of:
 * @param {string} req.body.recipient    E-mail address of recipient
 * @param {string} req.body.inviterName  Name of inviting user
 * @param {string} req.body.filename     Filename of file to update
 * @param {string} req.body.title        Title of file to update
 * @param {object} res                   Result object
 *
 * @return {object} result              The result as a JSON object.
 *
 * @return {boolean} result.inviteSent   true/false if successful/unsuccessful
 */
app.post("/sendinvite", async function(req, res) {

    const recipient = req.body.recipient;
    const inviterName = req.body.inviterName;
    const inviterEmail   = req.body.inviterEmail;
    const filename   = req.body.filename;
    const title   = req.body.title;

    let emailContentHtml = `
    <p>Hi there!</p>
    <p><strong>${inviterName}</strong> (${inviterEmail}) has invited
    you to join in editing their document <i>${filename}</i> ("${title}") at CirrusDocs –
    your new favourite collaborative online word processor.</p>

    <p>Follow this link, register using your e-mail
    address (${recipient}), and open <i>${filename}</i> to start editing:</p>
    <a href="https://www.student.bth.se/~riax20/editor/">Click here</a>
    <br><br>
    <p>Happy editing,</p>
    <i>${inviterName} and CirrusDocs</i>
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

    let status = 202;

    /** using Twilio SendGrid's v3 Node.js Library */
    /** https://github.com/sendgrid/sendgrid-nodejs */
    sgMail.setApiKey(config.sendgridsecret);

    sgMail
        .send(msg)
        .catch((error) => {
            console.error(error);
            result.inviteSent = false;
            status = 500;
        });

    res.status(status).json(result);
});

module.exports = app;
