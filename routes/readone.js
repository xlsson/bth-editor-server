"use strict";

const express = require('express');
const app = express();
const functions = require('../db/functions.js');

app.get("/readone/:filename", async function(req, res) {
    let result;

    let filename = req.params.filename;
    result = await functions.findByFilename(filename);

    res.status(200).json(result);
});

module.exports = app;
