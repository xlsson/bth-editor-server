"use strict";

const mongo = require("mongodb").MongoClient;
const config = require("./config.json");
const collectionName = "docs";
let dsn = `mongodb+srv://${config.username}:${config.password}@cluster0.xdeq5.mongodb.net/${config.dbname}?retryWrites=true&w=majority`;

const databaseConnection = {
    getDb: async function getDb () {
        if (process.env.NODE_ENV === 'test') {
            dsn = `mongodb+srv://${config.username}:${config.password}@cluster0.xdeq5.mongodb.net/${config.testdbname}?retryWrites=true&w=majority`;
        }

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
    databaseConnection: databaseConnection,
    dsn: dsn
};
