"use strict";

const { databaseConnection } = require('./databaseconnection.js');
const colName = "users";

const functions = {
    getAll: async function (res=undefined) {
        const database = await databaseConnection.getDb();
        try {
            let result = await database.collection.find({}).toArray();

            if (res === undefined) {
                return result;
            }

            return res.json({
                data: result
            });
        } catch (e) {
            return res.json({
                errors: {
                    status: 500,
                    name: "Database Error",
                    description: e.message,
                    path: "/",
                }
            })
        } finally {
            await database.client.close();
        }
    },

    getAllowedDocs: async function (email) {
        let all = await functions.getAll();

        let alloweddocs = [];
        all.forEach((owner) => {
            owner.docs.forEach((doc) => {
                if (doc.allowedusers.includes(email)) {
                    alloweddocs.push(doc);
                }
            });
        });
        return alloweddocs;
    },

    // Return owner email and name based on filename
    getOneDoc: async function (filename) {
        let result;
        const database = await databaseConnection.getDb();
        const client = await database.client;
        const db = await client.db();
        const col = await db.collection("users");

        try {
            const criteria = { docs: { $elemMatch: { filename: filename } } };
            const projection = { "docs.$": 1, name: 1, email: 1 };

            const res = await col.find(criteria).project(projection).toArray();

            result = {
                filename: filename,
                title: res[0].docs[0].title,
                content: res[0].docs[0].content,
                allowedusers: res[0].docs[0].allowedusers,
                ownerName: res[0].name,
                ownerEmail: res[0].email
            };

        } catch (err) {
            console.log(err);
            result = err;
        } finally {
            await database.client.close();
        }

        return result;
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

            const client = await database.client;
            const db = await client.db();
            const col = await db.collection(colName);
            const result = await col.find(criteria).project(projection).toArray();
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
