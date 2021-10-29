/**
 * @fileOverview Update the properties of a file, based on its filename.
 * @author - xlsson
 */

"use strict";

const express = require('express');
const app = express();
const functions = require('../db/functions.js');

/**
 * Update the properties of a file, based on its filename.
 *
 * @async
 *
 * @param {object} req                   Request object, consisting of:
 * @param {string} req.body.currentUser  E-mail of logged in user
 * @param {string} req.body.filename     Filename
 * @param {string} req.body.title        Title of file
 * @param {string} req.body.content      Contents of file
 * @param {array}  req.body.comments     Array of comment objects
 *
 * @param {object} res                   Result object:
 * @param {string} res.locals.userEmail  E-mail of logged in user
 *
 * @return {object} result              The result as a JSON object.
 *
 * @return {boolean} result.acknowledged     Successful operation = true
 * @return {number}  result.modifiedCount    Number of modified records (always 1)
 * @return {null}    result.upsertedId       Id of upserted record (always null)
 * @return {number}  result.upsertedCount    Number of upserted records (always 0)
 * @return {number}  result.matchedCount     Number of matching records (always 1)
 */
app.put("/updateone", async function(req, res) {
    const currentUser = res.locals.userEmail;
    const filename = req.body.filename;

    let result;
    let status = 200;

    /** Check if logged in user is among users allowed to edit document */
    let docBefore = await functions.getOneDoc(filename);

    if (docBefore.allowedusers.includes(currentUser)) {

        const doc = {
            filename: filename,
            title: req.body.title,
            content: req.body.content,
            comments: req.body.comments
        };

        result = await functions.updateDoc(doc);

    } else {
        result = { notAllowed: true };
        status = 401;
    }

    res.status(status).json(result);
});

module.exports = app;
