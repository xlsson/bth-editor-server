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
 * @param {string} req.body.filename     Filename
 * @param {string} req.body.title        Title of file
 * @param {string} req.body.content      Contents of file
 * @param {array}  req.body.comments     Array of comment objects
 * @param {object} res                   Result object
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
    let result;

    const doc = {
        filename: req.body.filename,
        title: req.body.title,
        content: req.body.content,
        comments: req.body.comments
    };

    result = await functions.updateDoc(doc);

    res.status(200).json(result);
});

module.exports = app;
