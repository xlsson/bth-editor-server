/**
 * @fileOverview Functions serving the GraphQL and other routes by sending
 * queries to the MongoDB database.
 * @author - xlsson
 *
 * @type {string} colName -         The collection name
 */

"use strict";

const { databaseConnection } = require('./databaseconnection.js');
const colName = "users";

const functions = {
    /**
     * Get the whole collection, without filters.
     *
     * @return {object} result  The whole database collection
     */
    getAll: async function () {
        const database = await databaseConnection.getDb();
        try {
            let result = await database.collection.find({}).toArray();
            return result;
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

    /**
     * Get all filenames where the user is allowed to edit (based on the current
     * mode used in the editor: code or text)
     *
     * @param {string} email        E-mail = username of user
     * @param {boolean} codemode    True if code mode, false if normal text mode
     *
     * @return {array} alloweddocs  An array of filenames
     */
    getAllowedDocs: async function (email, codemode) {
        let all = await functions.getAll();

        let alloweddocs = [];
        all.forEach((owner) => {
            owner.docs.forEach((doc) => {
                if ((doc.code === codemode) && (doc.allowedusers.includes(email))) {
                    alloweddocs.push(doc);
                }
            });
        });

        return alloweddocs;
    },

    /**
     * Get one file based on filename
     *
     * @param {string} filename     Filename
     *
     * @return {Object} result              The file, with these properties:
     * @return {String} result.filename     Filename
     * @return {Boolean} result.code        Mode (true if code mode, false if text)
     * @return {String} result.title        Title
     * @return {String} result.content      Content
     * @return {Array} result.comments      Array of comments (objects)
     * @return {Array} result.allowedusers  Array of users allowed to edit (strings)
     * @return {String} result.ownerName    Name of file owner
     * @return {String} result.ownerEmail   E-mail of file owner
     */
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
                code: res[0].docs[0].code,
                title: res[0].docs[0].title,
                content: res[0].docs[0].content,
                comments: res[0].docs[0].comments,
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

    /**
     * Add a new file to a user
     *
     * @param {Object} doc             The file to be saved, with its properties:
     * @param {String} doc.filename    Filename
     * @param {Boolean} doc.code       True for code mode, false if text
     * @param {String} doc.title       Title
     * @param {String} doc.content     Content
     * @param {Array} doc.comments     Array of comments (objects)
     * @param {Array} doc.allowedusers Array of all users allowed to edit (strings)
     *
     * @return {Object} result              The file, with these properties:
     *
     * If the filename is already taken:
     * @return {boolean} result.acknowledged     Set to false
     *
     * If the filename is not taken = success:
     * @return {boolean} result.acknowledged     Set to true
     * @return {number}  result.modifiedCount    Number of modified records (always 1)
     * @return {null}    result.upsertedId       Id of upserted record (always null)
     * @return {number}  result.upsertedCount    Number of upserted records (always 0)
     * @return {number}  result.matchedCount     Number of matching records (always 1)
     */
    createNewDoc: async function (doc) {
        let result;
        let email = doc.allowedusers[0];
        /** Check if filename is unique to the whole collection */
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

    /**
     * Update the properties of a file, based on its filename.
     *
     * @async
     *
     * @param {object} doc              File object, consisting of:
     * @param {string} doc.filename     Filename
     * @param {string} doc.title        Title of file
     * @param {string} doc.content      Contents of file
     * @param {array}  doc.comments     Array of comment objects
     *
     * @return {object} result              The result, with these properties:
     * @return {boolean} result.acknowledged     Successful operation = true
     * @return {number}  result.modifiedCount    Number of modified records (always 1)
     * @return {null}    result.upsertedId       Id of upserted record (always null)
     * @return {number}  result.upsertedCount    Number of upserted records (always 0)
     * @return {number}  result.matchedCount     Number of matching records (always 1)
     */
    updateDoc: async function (doc) {
        const database = await databaseConnection.getDb();
        const criteria = { "docs.filename": doc.filename };

        let result = await database.collection.updateOne(
            criteria,
            { $set: {
                "docs.$.content": doc.content,
                "docs.$.title": doc.title,
                "docs.$.comments": doc.comments
            } }
        );

        await database.client.close();
        return result;
    },

    /**
     * Update the list of users with editing rights for the specified filename.
     *
     * @async
     *
     * @param {object} params                Consisting of:
     * @param {string} params.filename       Filename
     * @param {array}  params.allowedusers   Array of all users with editing rights
     *
     * @return {object}  result                   The result, with these properties:
     * @return {boolean} result.acknowledged     Successful operation = true
     * @return {number}  result.modifiedCount    Number of modified records (always 1)
     * @return {null}    result.upsertedId       Id of upserted record (always null)
     * @return {number}  result.upsertedCount    Number of upserted records (always 0)
     * @return {number}  result.matchedCount     Number of matching records (always 1)
     * @return {array}   result.allowedusers     Array of all users with editing rights
     */
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

    /**
     * Register a new user by adding them as a new document in the collection.
     *
     * @async
     *
     * @param {object} user              User object, with these properties:
     * @param {string} user.name     Name of user
     * @param {string} user.email    User's e-mail = username
     * @param {string} user.password User's unhashed password
     *
     * @return {object} result       Result object, consisting of:
     *
     * If the e-mail already exists in the database:
     * @return {boolean} result.acknowledged    Set to false
     *
     * If the e-mail does not already exist in the database:
     * @return {boolean} result.acknowledged     Set to true
     * @return {string}  result.insertedId       The objectid of the new document
     */
    createNewUser: async function (user) {
        const database = await databaseConnection.getDb();

        let result;

        let checkEmail = await functions.getOneUser(user.email);

        if (checkEmail.length === 0) {
            result = await database.collection.insertOne(user);
        } else {
            result = { acknowledged: false };
        }

        await database.client.close();

        return result;
    },

    /**
     * Get one user, based on e-mail.
     *
     * @async
     *
     * @param {string} email       E-mail address = username
     *
     * @return {object} result              The result:
     * @return {string} result.userexists   ("true" or "false")
     *
     * If result.userexists = "true":
     * @return {string} result.verified     ("true" or "false")
     * @return {string} result.name         User's name
     * @return {string} result.email        User's email
     */
    getOneUser: async function (email) {
        const database = await databaseConnection.getDb();

        let result;

        try {
            const criteria = { email: email };
            const projection = { email: 1, name: 1, password: 1 };

            const client = await database.client;
            const db = await client.db();
            const col = await db.collection(colName);
            result = await col.find(criteria).project(projection).toArray();
        } catch (error) {
            console.log(error);
            result = { acknowledged: "false" };
        } finally {
            await database.client.close();
        }

        return result;
    },

    /**
     * Get an array with all filenames in the collection.
     *
     * @async
     *
     * @return {array} filenames    All filenames in the collection
     */
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
