"use strict";

const express = require('express');
const app = express();
const bcrypt = require('bcryptjs');
const functions = require('../db/functions.js');

app.post("/verifylogin", async function(req, res) {
    const email = req.body.email;
    const result = await functions.getOneUser(email);

    const password = req.body.password;
    const hashed = result[0].password;

    //Returns true if password matched database hash
    bcrypt.compare(password, hashed, function(err, result) {
        res.status(201).json(result);
    });
});

module.exports = app;
