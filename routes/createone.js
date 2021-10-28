/**
 * @fileOverview Saves a new file to the database.
 * @author - xlsson
 */

"use strict";

const express = require('express');
const app = express();
const functions = require('../db/functions.js');

/**
 * Save a new file to the database.
 *
 * @async
 *
 * @param {object} req                   Request object, consisting of:
 * @param {string} req.body.filename     Filename
 * @param {boolean} req.body.code        True of a code document, false if text
 * @param {string} req.body.title        Title of file
 * @param {string} req.body.content      Contents of file
 * @param {array}  req.body.comments     Array of comment objects
 * @param {string} req.body.email        E-mail = username of the creating user
 * @param {object} res                   Result object
 *
 * @return {object} result              The result as a JSON object.
 *
 * If the token validates (checked in the preceding middleware) but the filename
 * is taken:
 * @return {boolean} result.tokenIsVerified  Set to true
 *
 * If the token validates and the filename is not taken:
 * @return {boolean} result.acknowledged     Successful operation = true
 * @return {number}  result.modifiedCount    Number of modified records (always 1)
 * @return {null}    result.upsertedId       Id of upserted record (always null)
 * @return {number}  result.upsertedCount    Number of upserted records (always 0)
 * @return {number}  result.matchedCount     Number of matching records (always 1)
 *
 */
app.put("/createone", async function(req, res) {
    let result;

    const doc = {
        filename: req.body.filename,
        code: req.body.code,
        title: req.body.title,
        content: req.body.content,
        comments: req.body.comments,
        allowedusers: [req.body.email]
    };

    result = await functions.createNewDoc(doc);

    res.status(201).json(result);
});

module.exports = app;
