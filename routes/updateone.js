"use strict";

const express = require('express');
const app = express();
const functions = require('../db/functions.js');

app.put("/updateone", async function(req, res) {
    let result;

    const doc = {
        filename: req.body.filename,
        title: req.body.title,
        content: req.body.content,
        comments: req.body.comments
    };

    result = await functions.updateDoc(doc);

    res.status(200).json(result);
});

module.exports = app;
