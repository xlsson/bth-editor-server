"use strict";

const express = require('express');
const app = express();
const functions = require('../db/functions.js');

app.get("/readone/:filename", async function(req, res) {
    let result;

    if (res.locals.tokenIsVerified) {
        let filename = req.params.filename;
        result = await functions.findByFilename(filename);
        result.tokenIsVerified = true;
    } else {
        result = {
            tokenIsVerified: false
        };
    }
    res.status(200).json(result);
});

module.exports = app;
