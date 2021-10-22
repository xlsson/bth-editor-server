"use strict";

const express = require('express');
const app = express();
const functions = require('../db/functions.js');

app.put("/createone", async function(req, res) {
    let result;

    const doc = {
        filename: req.body.filename,
        code: req.body.code,
        title: req.body.title,
        content: req.body.content,
        allowedusers: [req.body.email]
    };

    result = await functions.createNewDoc(doc);

    res.status(201).json(result);
});

module.exports = app;
