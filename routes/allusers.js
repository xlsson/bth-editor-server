"use strict";

const express = require('express');
const app = express();
const functions = require('../db/functions.js');

app.get("/allusers", async function(req, res) {
    let result = {};

    result.allUsers = await functions.getAllUsers();

    res.status(200).json(result);
});

module.exports = app;
