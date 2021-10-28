/**
 * @fileOverview UserType class, serving as the object representing a user for the
 * GraphQL routes.
 * @author - xlsson
 */

const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLNonNull
} = require('graphql');

const DocType = require("./doc.js");

const UserType = new GraphQLObjectType({
    name: 'User',
    description: 'This represents a user',
    fields: () => ({
        email: { type: GraphQLNonNull(GraphQLString) },
        name: { type: GraphQLNonNull(GraphQLString) },
        password: { type: GraphQLNonNull(GraphQLString) },
        docs: {
            type: GraphQLList(DocType),
            resolve: (user) => {
                return user.docs
            }
        }
    })
})

module.exports = UserType;
