/**
 * @fileOverview RootQueryType class, serving as the root object for the
 * GraphQL routes.
 * @author - xlsson
 */

const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLBoolean
} = require('graphql');

const UserType = require("./user.js");
const DocType = require("./doc.js");

const functions = require("../db/functions.js");

const RootQueryType = new GraphQLObjectType({
    name: 'Query',
    description: 'Root Query',
    fields: () => ({
        user: {
            type: UserType,
            description: 'One user',
            args: {
                email: { type: GraphQLString }
            },
            resolve: async function(parent, args) {
                let usersArray = await functions.getAll();

                return usersArray.find(user => user.email === args.email);
            }
        },
        users: {
            type: GraphQLList(UserType),
            description: 'All users',
            resolve: async function() {
                return await functions.getAll();
            }
        },
        doc: {
            type: DocType,
            description: 'One document',
            args: {
                filename: { type: GraphQLString }
            },
            resolve: async function(parent, args) {
                return functions.getOneDoc(args.filename);
            }
        },
        allowedDocs: {
            type: GraphQLList(DocType),
            args: {
                email: { type: GraphQLString },
                code: { type: GraphQLBoolean }
            },
            description: `
                All files that a user is allowed to edit,
                depending on the current mode (code or normal)`,
            resolve: async function(parent, args) {
                return functions.getAllowedDocs(args.email, args.code);
            }
        }
    })
});

module.exports = RootQueryType;
