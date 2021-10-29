/**
 * @fileOverview Verify username and password
 * @author - xlsson
 */

"use strict";

const express = require('express');
const app = express();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const functions = require('../db/functions.js');

let config;

if (process.env.NODE_ENV === 'test') {
    config = require("../db/testconfig.json");
} else {
    config = require("../db/config.json");
}

/**
 * Route to verify that a bcrypt hash of a password matches hash stored in db.
 *
 * @async
 *
 * @param {object} req                  Request object, consisting of:
 * @param {string} req.body.email       E-mail address = username
 * @param {string} req.body.password    Unhashed password
 * @param {object} res                  Result object
 *
 * @return {object} result              The result as a JSON object.
 * @return {string} result.userexists   ("true" or "false")
 *
 * If result.userexists = "true":
 * @return {string} result.verified     ("true" or "false")
 * @return {string} result.name         User's name
 * @return {string} result.email        User's email
 */
app.post("/verifylogin", async function(req, res) {
    const email = req.body.email;
    const password = req.body.password;
    let name;
    let hashed;

    const user = await functions.getOneUser(email);

    try {
        name = user[0].name;
        hashed = user[0].password;
        bcrypt.compare(password, hashed, function(err, isVerified) {
            let result = {
                userexists: true,
                verified: isVerified,
                name: name,
                email: email
            };

            let status;

            /** Create a token for this session */
            if (isVerified) {
                const payload = { email: email };
                const secret = config.jwtsecret;
                const token = jwt.sign(payload, secret, { expiresIn: '1h'});
                result.token = token;
                status = 201;
            } else {
                status = 401;
            }
            res.status(status).json(result);
        });
    } catch (e) {
        let result = { userexists: false };
        res.status(401).json(result);
    }
});

module.exports = app;
