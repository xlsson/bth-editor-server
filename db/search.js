"use strict";

const express = require('express');
const app = express();

const {databaseConnection, dsn} = require('./databaseconnection.js');

/**
 * Find documents in an collection by matching search criteria.
 *
 * @async
 *
 * @param {string} dsn        DSN to connect to database.
 * @param {string} colName    Name of collection.
 * @param {object} criteria   Search criteria.
 * @param {object} projection What to project in results.
 * @param {number} limit      Limit the number of documents to retrieve.
 *
 * @throws Error when database operation fails.
 *
 * @return {Promise<array>} The resultset as an array.
 */
const search = {
    find: async function findInCollection(dsn, colName, criteria, projection, limit) {

        const database = await databaseConnection.getDb();
        const client = await database.client;
        const db = await client.db();
        const col = await db.collection(colName);
        const res = await col.find(criteria, projection).limit(limit).toArray();
        await client.close();

        return res;
    }
};

module.exports = search;
