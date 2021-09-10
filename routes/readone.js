"use strict";

const express = require('express');
const app = express();

const search = require('../db/search.js');

app.get("/readone/:docId", async function(req, res) {
    let docId = req.params.docId;
    console.log(docId);
    let result = await search.findById(docId);

    res.status(200).json(result);
});

module.exports = app;
