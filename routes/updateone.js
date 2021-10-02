"use strict";

const express = require('express');
const app = express();
const functions = require('../db/functions.js');

app.put("/updateone", async function(req, res) {
    let result;

    if (res.locals.tokenIsVerified) {
        const doc = {
            filename: req.body.filename,
            title: req.body.title,
            content: req.body.content
        };

        result = await functions.updateDoc(doc);
        result.tokenIsVerified = true;
    } else {
        result = {
            acknowledged: false,
            tokenIsVerified: false
        };
    }

    res.status(200).json(result);
});

module.exports = app;
