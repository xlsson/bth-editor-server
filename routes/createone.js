"use strict";

const express = require('express');
const app = express();

const {databaseConnection, dsn} = require('../db/databaseconnection.js');
const search = require('../db/search.js');

app.post("/createone", async function(req, res) {

    const doc = {
        filename: req.body.filename,
        title: req.body.title,
        content: req.body.content
    };

    // Check if document name already exists
    let result = await search.findByName(doc.filename);

    //Only create if document name doesn't already exist
    if (result[0].exists == "false") {
        const database = await databaseConnection.getDb();
        result = await database.collection.insertOne(doc);
        await database.client.close();
    }

    res.status(201).json(result);
});

module.exports = app;
