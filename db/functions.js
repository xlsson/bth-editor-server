"use strict";

const express = require('express');
const app = express();
const ObjectId = require('mongodb').ObjectId;
const {databaseConnection, dsn} = require('./databaseconnection.js');
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

    // Return all filenames where email is among allowedusers
    findByAllowedUser: async function (email) {
        let result = [];
        try {
            const criteria = { docs: { $elemMatch: { allowedusers: email } } };
            const projection = { docs: 1 };

            // Find all users which have at least one doc
            // where email is among the allowed users
            result = await functions.find(criteria, projection);

            // Save all documents from all users to one single array
            let alldocs = [];
            result.forEach((owner) => {
                alldocs = alldocs.concat(owner.docs);
            });

            // Save all filenames where the document is among the allowed users
            // to an array
            let allowedfiles = [];
            alldocs.forEach((doc) => {
                if (doc.allowedusers.includes(email)) {
                    allowedfiles.push(doc.filename);
                }
            });

            result = allowedfiles;

        } catch (err) {
            console.log(err);
            result = err;
        }
        return result;
    },

    // Return file info with matching filename
    findByFilename: async function (filename) {
        console.log(filename);
        let result;
        try {
            const criteria = { docs: { $elemMatch: { filename: filename } } };
            const projection = { "docs.$": 1, name: 1, email: 1 };
            const limit = 1;

            result = await functions.find(criteria, projection, limit);

            result = {
                ownerName: result[0].name,
                ownerEmail: result[0].email,
                title: result[0].docs[0].title,
                content: result[0].docs[0].content,
                allowedusers: result[0].docs[0].allowedusers
            };
            console.log(result);
        } catch (err) {
            console.log(err);
            result = err;
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

        return filenames;
    }
};

module.exports = functions;
