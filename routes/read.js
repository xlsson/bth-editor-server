"use strict";

const express = require('express');
const app = express();

const databaseConnection = require('../db/databaseconnection.js');

app.get("/read", async function(req, res) {

    let database = await databaseConnection.getDb();
    let resultSet = await database.collection.find({}).toArray();

    await database.client.close();

    res.status(200).json(resultSet);
});

module.exports = app;
