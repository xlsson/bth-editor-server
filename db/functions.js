"use strict";

const { databaseConnection } = require('./databaseconnection.js');
const colName = "users";

const functions = {

    find: async function (criteria, projection) {
        const database = await databaseConnection.getDb();
        const client = await database.client;
        const db = await client.db();
        const col = await db.collection(colName);
        const res = await col.find(criteria).project(projection).toArray();
        await client.close();
        return res;
    },

    createNewDoc: async function (doc) {
        let result;
        let email = doc.allowedusers[0];
        //Check if filename is unique to the whole collection
        const filenames = await functions.getAllFilenames();

        if (!filenames.includes(doc.filename)) {
            const database = await databaseConnection.getDb();

            result = await database.collection.updateOne(
                { email: email },
                { $push: {
                    docs: doc
                }
            });
            await database.client.close();
        } else {
            result = {
                acknowledged: false
            };
        }

        return result;
    },

    updateDoc: async function (doc) {
        const database = await databaseConnection.getDb();
        const criteria = { "docs.filename": doc.filename };

        let result = await database.collection.updateOne(
            criteria,
            { $set: { "docs.$.content": doc.content, "docs.$.title": doc.title } }
        );

        await database.client.close();
        return result;
    },

    updateUsers: async function (params) {
        const database = await databaseConnection.getDb();
        const criteria = { "docs.filename": params.filename };

        let result = await database.collection.updateOne(
            criteria,
            { $set: { "docs.$.allowedusers": params.allowedusers } }
        );

        result.allowedusers = params.allowedusers;

        await database.client.close();
        return result;
    },

    createNewUser: async function (user) {
        const database = await databaseConnection.getDb();

        let result;

        // An error is thrown if the email already exists (email is set as unique)
        try {
            result = await database.collection.insertOne(user);
        } catch (error) {
            console.log(error);
            result = { acknowledged: "false" };
        } finally {
            await database.client.close();
        }

        return result;
    },

    //getOneUser based on email
    getOneUser: async function (email) {
        const database = await databaseConnection.getDb();

        let result;

        try {
            const criteria = { email: email };
            const projection = { email: 1, name: 1, password: 1 };

            result = await functions.find(criteria, projection);
        } catch (error) {
            console.log(error);
            result = { acknowledged: "false" };
        } finally {
            await database.client.close();
        }

        return result;
    },

    // Return array with all filenames in the collection
    getAllFilenames: async function () {
        let documents = [];
        let filenames = [];
        const database = await databaseConnection.getDb();
        let all = await database.collection.find({}).toArray();

        all.forEach((user) => {
            documents = documents.concat(user.docs);
        });

        documents.forEach((document) => {
            filenames.push(document.filename);
        });

        await database.client.close();

        return filenames;
    }
};

module.exports = functions;
