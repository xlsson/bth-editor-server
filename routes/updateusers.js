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
 * @param {object} res                   Result object
 *
 * @return {object} result              The result as a JSON object.
 *
 * If the token validates:
 * @return {boolean} result.acknowledged     Successful operation = true
 * @return {number}  result.modifiedCount    Number of modified records (always 1)
 * @return {null}    result.upsertedId       Id of upserted record (always null)
 * @return {number}  result.upsertedCount    Number of upserted records (always 0)
 * @return {number}  result.matchedCount     Number of matching records (always 1)
 * @return {array}   result.allowedusers     Array of all users with editing rights
 */
app.put("/updateusers", async function(req, res) {
    let result;

    const params = {
        filename: req.body.filename,
        allowedusers: req.body.allowedusers
    };

    result = await functions.updateUsers(params);

    res.status(200).json(result);
});

module.exports = app;
