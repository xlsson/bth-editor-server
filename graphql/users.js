const { databaseConnection } = require("../db/databaseconnection.js");

const users = {
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
    }
};

module.exports = users;
