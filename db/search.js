"use strict";

const express = require('express');
const ObjectId = require('mongodb').ObjectId;

const app = express();

const {databaseConnection, dsn} = require('./databaseconnection.js');

const search = {

    /**
     * Find documents in collection by matching search criteria.
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
    find: async function findInCollection(dsn, colName, criteria, projection, limit) {
        const database = await databaseConnection.getDb();
        const client = await database.client;
        const db = await client.db();
        const col = await db.collection(colName);
        const res = await col.find(criteria, projection).limit(limit).toArray();
        await client.close();
        return res;
    },

    /**
     * Find documents in collection by matching document Id
     *
     * @async
     *
     * @param {string} docId    Id of document

     * @throws Error when database operation fails.
     *
     * @return {Promise<array>} The resultset as an array.
     */
    findById: async function (docId) {

    let documentInfo = [ { exists: "false" } ];
        const objectDocId = new ObjectId(docId);

        // Check if id exists in collection
        try {
            const criteria = { _id: objectDocId };
            const projection = { _id: 1, docname: 1, content: 1 };
            const limit = 1;

            const result = await search.find(
                dsn, "docs", criteria, projection, limit
            );

            if ((typeof(result[0]) != "undefined")) {
                documentInfo = [ {
                    exists: "true",
                    _id: result[0]._id,
                    docname: result[0].docname,
                    content: result[0].content
                } ];
            }
        } catch (err) {
            console.log(err);
        }
        return documentInfo;
    },

    /**
     * Find documents in collection by matching document name
     *
     * @async
     *
     * @param {string} docname    Name of document

     * @throws Error when database operation fails.
     *
     * @return {Promise<array>} The resultset as an array.
     */
    findByName: async function (docname) {
    let documentInfo = [ { exists: "false" } ];

        // Check if docname already exists in collection
        try {
            const criteria = { docname: docname };
            const projection = { _id: 0, docname: 1 };
            const limit = 1;

            const result = await search.find(
                dsn, "docs", criteria, projection, limit
            );

            if ((typeof(result[0]) != "undefined")) {
                documentInfo = [ {
                    exists: "true",
                    docname: result[0].docname,
                    content: result[0].content
                } ];
            }
        } catch (err) {
            console.log(err);
        }
        return documentInfo;
    }
};

module.exports = search;
