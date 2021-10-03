"use strict";

const express = require('express');
const app = express();
const functions = require('../db/functions.js');

app.get("/allusers", async function(req, res) {
    let result = {};

    if (res.locals.tokenIsVerified) {
        result.allUsers = await functions.getAllUsers();
        result.tokenIsVerified = true;
    } else {
        result.tokenIsVerified = false;
    }
    res.status(200).json(result);
});

module.exports = app;
