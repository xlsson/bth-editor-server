/**
 * @fileOverview Registers a new user by adding them as a new document in
 * the collection.
 * @author - xlsson
 */

"use strict";

const express = require('express');
const app = express();
const bcrypt = require('bcryptjs');
const functions = require('../db/functions.js');

/**
 * Register a new user by adding them as a new document in the collection.
 *
 * @async
 *
 * @param {object} req               Request object, consisting of:
 * @param {string} req.body.name     Name of user
 * @param {string} req.body.email    User's e-mail = username
 * @param {string} req.body.password User's unhashed password
 * @param {object} res               Result object
 *
 * @return {object} result              The result as a JSON object.
 *
 * If the e-mail already exists in the database:
 * @return {boolean} result.acknowledged    Set to false
 *
 * If the e-mail does not already exist in the database:
 * @return {boolean} result.acknowledged     Set to true
 * @return {string}  result.insertedId       The objectid of the new user
 */
app.post("/createuser", async function(req, res) {
    let password = req.body.password;

    let user = {
        email: req.body.email,
        name: req.body.name,
        docs: []
    };

    const saltRounds = 10;

    /** Hashes password and saves hash instead of the plain password */
    user.password = await bcrypt.hash(password, saltRounds);

    const result = await functions.createNewUser(user);

    let status = 201;

    if (!result.acknowledged) {
        status = 400;
    }

    res.status(status).json(result);
});

module.exports = app;
