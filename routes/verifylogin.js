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

            //Create a token for this session
            if (isVerified) {
                const payload = { email: email };
                const secret = config.jwtsecret;
                const token = jwt.sign(payload, secret, { expiresIn: '1h'});
                result.token = token;
            }
            res.status(201).json(result);
        });
    } catch (e) {
        let result = { userexists: false };
        res.status(201).json(result);
    }
});

module.exports = app;
