"use strict";

const express = require('express');
const app = express();
const bcrypt = require('bcryptjs');
const functions = require('../db/functions.js');

app.post("/createuser", async function(req, res) {
    let password = req.body.password;

    let user = {
        email: req.body.email,
        name: req.body.name,
        docs: []
    };

    const saltRounds = 10;

    //Hashes password and saves hash instead of password
    user.password = await bcrypt.hash(password, saltRounds);

    const result = await functions.createNewUser(user);

    res.status(201).json(result);
});

module.exports = app;
