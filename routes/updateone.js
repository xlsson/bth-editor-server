"use strict";

const express = require('express');
const app = express();

const ObjectId = require('mongodb').ObjectId;

const {databaseConnection, dsn} = require('../db/databaseconnection.js');

app.put("/updateone", async function(req, res) {
    let database = await databaseConnection.getDb();

    const docId = req.body.docid;
    const title = req.body.title;
    const content = req.body.content;

    const objectDocId = new ObjectId(docId);

    const result = await database.collection.updateOne(
        { _id: objectDocId },
        { $set: { content: content, title: title } }
    );

    res.status(204).send();
});

module.exports = app;
