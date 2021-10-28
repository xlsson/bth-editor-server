/**
 * @fileOverview Functions handling the database connection.
 * @author - xlsson
 *
 * @type {string} collectionName -  The collection name
 * @type {Object} config -          Object containing login credentials
 * @type {string} dsn -             The dsn to connect to
 * @type {string} dbname -          The database name, as specified in the config file
 */

"use strict";

const mongo = require("mongodb").MongoClient;
const collectionName = "users";

let config;
let dsn;
let dbname;

/** Use a live database in dev or live mode, use a local test server in test mode */
if (process.env.NODE_ENV === 'test') {
    dsn = `mongodb://localhost/test`;
} else if (process.env.NODE_ENV === 'dev') {
    config = require("./config.json");
    dsn = `mongodb+srv://${config.username}:${config.password}@cluster0.xdeq5.mongodb.net/${config.devdbname}?retryWrites=true&w=majority`;
} else {
    config = require("./config.json");
    dsn = `mongodb+srv://${config.username}:${config.password}@cluster0.xdeq5.mongodb.net/${config.dbname}?retryWrites=true&w=majority`;
}

const databaseConnection = {
    /**
     * Access the database using the dsn, username and password specified in the
     * config file (for the live database). For the test database, no password
     * or username is needed.
     *
     * @return {object} returnobject.collection     A Collection instance
     * @return {object} returnobject.client         A reference to the database
     */
    getDb: async function getDb () {
        const client  = await mongo.connect(dsn, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        const db = await client.db();
        const collection = await db.collection(collectionName);

        return {
            collection: collection,
            client: client,
        };
    }
};

module.exports = {
    /** The object containing the getDb function */
    databaseConnection: databaseConnection,
    /** The dsn */
    dsn: dsn
};
