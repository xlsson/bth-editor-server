const { databaseConnection } = require("../db/databaseconnection.js");

const dbfunctions = {
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
        let all = await dbfunctions.getAll();

        let alloweddocs = [];
        all.forEach((owner) => {
            owner.docs.forEach((doc) => {
                if (doc.allowedusers.includes(email)) {
                    alloweddocs.push(doc);
                }
            });
        });
        console.log(alloweddocs);
        return alloweddocs;
    },

    // Return owner email and name based on filename
    getOneDoc: async function (filename) {
        let result;
        try {
            const criteria = { docs: { $elemMatch: { filename: filename } } };
            const projection = { "docs.$": 1, name: 1, email: 1 };

            const database = await databaseConnection.getDb();
            const client = await database.client;
            const db = await client.db();
            const col = await db.collection("users");
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
        }

        console.log(result);
        return result;
    },
};

module.exports = dbfunctions;
