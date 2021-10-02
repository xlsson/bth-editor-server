"use strict";

const express = require('express');
const app = express();
const functions = require('../db/functions.js');

app.put("/createone", async function(req, res) {
    let result;

    if (res.locals.tokenIsVerified) {
        const doc = {
            filename: req.body.filename,
            title: req.body.title,
            content: req.body.content,
            allowedusers: [req.body.email]
        };

        result = await functions.createNewDoc(doc);
        result.tokenIsVerified = true;
    } else {
        result = {
            acknowledged: false,
            tokenIsVerified: false
        };
    }

    console.log(result);
    res.status(201).json(result);
});

module.exports = app;
