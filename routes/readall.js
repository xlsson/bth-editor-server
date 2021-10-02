"use strict";

const express = require('express');
const app = express();
const functions = require('../db/functions.js');

app.get("/readall/:email", async function(req, res) {
    let result = {};

    if (res.locals.tokenIsVerified) {
        let email = req.params.email;
        result.allFilenames = await functions.findByAllowedUser(email);
        result.tokenIsVerified = true;
    } else {
        result.tokenIsVerified = false;
    }
    res.status(200).json(result);
});

module.exports = app;
