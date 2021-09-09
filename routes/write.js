"use strict";

const express = require('express');
const app = express();

const databaseConnection = require('../db/databaseconnection.js');

app.post("/write", async function(req, res) {

    const database = await databaseConnection.getDb();

    let doc = {
        docname: req.body.docname,
        content: req.body.content,
    };

    let result = await database.collection.insertOne(doc);

    await database.client.close();

    res.status(201).json(result);
});

module.exports = app;
