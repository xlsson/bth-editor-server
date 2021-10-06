const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLList
} = require('graphql');

const UserType = require("./user.js");

const users = require("./users.js");

const RootQueryType = new GraphQLObjectType({
    name: 'Query',
    description: 'Root Query',
    fields: () => ({
        user: {
            type: UserType,
            description: 'A single user',
            args: {
                email: { type: GraphQLString }
            },
            resolve: async function(parent, args) {
                let usersArray = await users.getAll()

                return usersArray.find(user => user.email === args.email);
            }
        },
        users: {
            type: GraphQLList(UserType),
            description: 'List of all users',
            resolve: async function() {
                return await users.getAll();
            }
        }
    })
});

module.exports = RootQueryType;
