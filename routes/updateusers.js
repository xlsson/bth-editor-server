"use strict";

const express = require('express');
const app = express();
const functions = require('../db/functions.js');

app.put("/updateusers", async function(req, res) {
    let result;

    const params = {
        filename: req.body.filename,
        allowedusers: req.body.allowedusers
    };

    result = await functions.updateUsers(params);

    res.status(200).json(result);
});

module.exports = app;
