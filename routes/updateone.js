"use strict";

const express = require('express');
const app = express();
const search = require('../db/search.js');

const ObjectId = require('mongodb').ObjectId;

const {databaseConnection, dsn} = require('../db/databaseconnection.js');

app.put("/updateone", async function(req, res) {
    let database = await databaseConnection.getDb();

    const docId = req.body.docid;
    const title = req.body.title;
    const content = req.body.content;

    const objectDocId = new ObjectId(docId);

    await database.collection.updateOne(
        { _id: objectDocId },
        { $set: { content: content, title: title } }
    );

    await database.client.close();

    let result = await search.findById(docId);

    res.status(200).json(result);
});

module.exports = app;
