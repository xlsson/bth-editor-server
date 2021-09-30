"use strict";

const express = require('express');
const app = express();
const functions = require('../db/functions.js');

app.post("/createuser", async function(req, res) {

    const user = {
        email: req.body.email,
        name: req.body.name,
        docs: []
    };

    const result = await functions.createNewUser(user);

    console.log(result);
    res.status(201).json(result);
});

module.exports = app;
