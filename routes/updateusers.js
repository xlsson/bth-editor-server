/**
 * @fileOverview Update list of allowed users for a file
 * @author - xlsson
 */

"use strict";

const express = require('express');
const app = express();
const functions = require('../db/functions.js');

/**
 * Update the list of users with editing rights for the specified filename.
 *
 * @async
 *
 * @param {object} req                   Request object, consisting of:
 * @param {string} req.body.filename     Filename
 * @param {array}  req.body.allowedusers Array of all users with editing rights
 *
 * @param {object} res                   Result object:
 * @param {string} res.locals.userEmail  E-mail of logged in user
 *
 * @return {object}  result                  The result as a JSON object.
 * @return {boolean} result.acknowledged     Successful operation = true
 * @return {number}  result.modifiedCount    Number of modified records (always 1)
 * @return {null}    result.upsertedId       Id of upserted record (always null)
 * @return {number}  result.upsertedCount    Number of upserted records (always 0)
 * @return {number}  result.matchedCount     Number of matching records (always 1)
 * @return {array}   result.allowedusers     Array of all users with editing rights
 */
app.put("/updateusers", async function(req, res) {
    const currentUser = res.locals.userEmail;
    const filename = req.body.filename;

    let result;
    let status = 200;

    /** Check if logged in user is among users allowed to edit document */
    let docBefore = await functions.getOneDoc(filename);

    if (docBefore.ownerEmail === currentUser) {

        const params = {
            filename: req.body.filename,
            allowedusers: req.body.allowedusers
        };

        result = await functions.updateUsers(params);

    } else {
        result = { notAllowed: true };
        status = 401;
    }

    res.status(status).json(result);
});

module.exports = app;
