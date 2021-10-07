"use strict";

const express = require('express');
const app = express();
const functions = require('../db/functions.js');

app.get("/readall/:email", async function(req, res) {
    let result = {};

    let email = req.params.email;
    result.allowedDocs = await functions.findByAllowedUser(email);

    res.status(200).json(result);
});

module.exports = app;
