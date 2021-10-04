"use strict";

const mongo = require("mongodb").MongoClient;
const collectionName = "users";

let config;
let dsn;
let dbname;

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
    databaseConnection: databaseConnection,
    dsn: dsn
};
