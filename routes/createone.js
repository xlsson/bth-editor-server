"use strict";

const express = require('express');
const app = express();
const functions = require('../db/functions.js');

app.put("/createone", async function(req, res) {
    const doc = {
        filename: req.body.filename,
        title: req.body.title,
        content: req.body.content,
        allowedusers: [req.body.email]
    };

    let result = await functions.createNewDoc(doc);

    console.log(result);
    res.status(201).json(result);
});

module.exports = app;
