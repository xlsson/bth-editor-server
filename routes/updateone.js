"use strict";

const express = require('express');
const app = express();
const functions = require('../db/functions.js');

app.put("/updateone", async function(req, res) {
    const doc = {
        filename: req.body.filename,
        title: req.body.title,
        content: req.body.content
    };

    const result = await functions.updateDoc(doc);

    console.log(result);
    res.status(200).json(result);
});

module.exports = app;
