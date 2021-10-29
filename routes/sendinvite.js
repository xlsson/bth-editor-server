/**
 * @fileOverview Update the array of users allowed to edit, and send an
 * invitation e-mail using SendGrid.
 * @author - xlsson
 */

"use strict";

const express = require('express');
const app = express();
const functions = require('../db/functions.js');
const sgMail = require('@sendgrid/mail');

let config;

if (process.env.NODE_ENV === 'test') {
    config = require("../db/testconfig.json");
} else {
    config = require("../db/config.json");
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
 *
 * @param {object} res                   Result object:
 * @param {string} res.locals.userEmail  E-mail of logged in user
 *
 * @return {object} result              The result as a JSON object.
 *
 * @return {boolean} result.inviteSent   true/false if successful/unsuccessful
 */
app.post("/sendinvite", async function(req, res) {
    const currentUser   = res.locals.userEmail;
    const filename   = req.body.filename;

    let result;
    let status = 202;

    /** Check if logged in user is among users allowed to edit document */
    let docBefore = await functions.getOneDoc(filename);

    if (docBefore.ownerEmail === currentUser) {

        const recipient = req.body.recipient;
        const inviterName = req.body.inviterName;
        const title   = req.body.title;

        let emailContentHtml = `
        <p>Hi there!</p>
        <p><strong>${inviterName}</strong> (${currentUser}) has invited
        you to join in editing their document <i>${filename}</i> ("${title}")
        at CirrusDocs.</p>

        <p>Follow this link, register using your e-mail
        address (${recipient}), and open <i>${filename}</i> to start editing:</p>
        <a href="https://www.student.bth.se/~riax20/editor/">Click here</a>
        <br><br>
        <p>Happy editing,<br>
        <i>${inviterName} and CirrusDocs</i>
        </p>
        `;

        const msg = {
            to: recipient,
            from: 'riax20@student.bth.se',
            subject: `CirrusDocs – invitation to edit from ${inviterName}`,
            html: emailContentHtml
        };

        result = { inviteSent: true };

        /** Skip actually sending an e-mail if this is just a test */
        if (process.env.NODE_ENV !== 'test') {
            /** using Twilio SendGrid's v3 Node.js Library */
            /** https://github.com/sendgrid/sendgrid-nodejs */
            sgMail.setApiKey(config.sendgridsecret);

            sgMail
                .send(msg)
                .catch((error) => {
                    console.error(error);
                    result = { inviteSent: false };
                    status = 500;
                });
        }

    } else {
        result = { notAllowed: true };
        status = 401;
    }

    res.status(status).json(result);
});

module.exports = app;
