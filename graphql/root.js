const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLList
} = require('graphql');

const UserType = require("./user.js");
const DocType = require("./doc.js");

const dbfunctions = require("./dbfunctions.js");

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
                let usersArray = await dbfunctions.getAll();

                return usersArray.find(user => user.email === args.email);
            }
        },
        users: {
            type: GraphQLList(UserType),
            description: 'All users',
            resolve: async function() {
                return await dbfunctions.getAll();
            }
        },
        doc: {
            type: DocType,
            description: 'One document',
            args: {
                filename: { type: GraphQLString }
            },
            resolve: async function(parent, args) {
                return dbfunctions.getOneDoc(args.filename);
            }
        },
        allowedDocs: {
            type: GraphQLList(DocType),
            args: {
                email: {type: GraphQLString }
            },
            description: 'All files that a user is allowed to edit',
            resolve: async function(parent, args) {
                return dbfunctions.getAllowedDocs(args.email);
            }
        }
    })
});

module.exports = RootQueryType;
