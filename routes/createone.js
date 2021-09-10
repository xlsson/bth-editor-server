"use strict";

const express = require('express');
const app = express();

const {databaseConnection, dsn} = require('../db/databaseconnection.js');
const search = require('../db/search.js');

app.post("/createone", async function(req, res) {

    const database = await databaseConnection.getDb();

    let returnValue = [{}];

    const doc = {
        docname: req.body.docname,
        content: req.body.content,
    };

    let uniqueName = true;

    // Check if docname already exists in collection
    try {
        const criteria = { docname: doc.docname };
        const projection = { _id: 0, docname: 1 };
        const limit = 1;

        const result = await search.find(
            dsn, "docs", criteria, projection, limit
        );
        console.log(result);
        if ((typeof(result[0]) != "undefined")) {
            uniqueName = false;
        }
    } catch (err) {
        console.log(err);
    }

    if (uniqueName) {
        returnValue = await database.collection.insertOne(doc);
        await database.client.close();
    }

    res.status(201).json(returnValue);
});

module.exports = app;
