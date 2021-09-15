"use strict";

const mongo = require("mongodb").MongoClient;
const collectionName = "docs";

let config;

try {
    config = require("./config.json");
} catch (e) {
    console.log(e);
}

const secrets = process.env.JWT_SECRET || config;

let dbname = secrets.dbname;

if (process.env.NODE_ENV === 'dev') {
    dbname = secrets.devdbname;
}

let dsn = `mongodb+srv://${secrets.username}:${secrets.password}@cluster0.xdeq5.mongodb.net/${dbname}?retryWrites=true&w=majority`;

if (process.env.NODE_ENV === 'test') {
    dsn = `mongodb://127.0.0.1/test`;
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
