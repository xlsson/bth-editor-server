"use strict";

const express = require('express');
const app = express();
const bcrypt = require('bcryptjs');
const functions = require('../db/functions.js');

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
            res.status(201).json(result);
        });
    } catch (e) {
        let result = { userexists: false };
        res.status(201).json(result);
    }
});

module.exports = app;
