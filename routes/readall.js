"use strict";

const express = require('express');
const app = express();
const functions = require('../db/functions.js');

app.get("/readall/:email", async function(req, res) {
    let email = req.params.email;
    let result = await functions.findByAllowedUser(email);

    console.log(result);
    res.status(200).json(result);
});

module.exports = app;
