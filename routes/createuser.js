"use strict";

const express = require('express');
const app = express();
const bcrypt = require('bcryptjs');
const functions = require('../db/functions.js');

app.post("/createuser", async function(req, res) {
    let password = req.body.password;

    //Hashes password and saves hash instead of password
    bcrypt.hash(password, 10, async function(err, hash) {
        const user = {
            email: req.body.email,
            password: hash,
            name: req.body.name,
            docs: []
        };

        const result = await functions.createNewUser(user);

        res.status(201).json(result);
    });

});

module.exports = app;
