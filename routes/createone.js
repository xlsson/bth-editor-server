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
 * If the filename is taken:
 * @return {boolean} result.acknowledged     Set to false
 *
 * If the filename is not taken:
 * @return {boolean} result.acknowledged     Set to true
 * @return {number}  result.modifiedCount    Number of modified records (always 1)
 * @return {null}    result.upsertedId       Id of upserted record (always null)
 * @return {number}  result.upsertedCount    Number of upserted records (always 0)
 * @return {number}  result.matchedCount     Number of matching records (always 1)
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

    let undefinedProperty = false;
    Object.keys(doc).forEach((key) => {
        if (doc[key] === undefined) { undefinedProperty = true; }
    });

    if (!undefinedProperty) {
        result = await functions.createNewDoc(doc);
    } else {
        result = { acknowledged: false };
    }

    res.status(201).json(result);
});

module.exports = app;
