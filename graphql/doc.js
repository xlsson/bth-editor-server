/**
 * @fileOverview DocType class, serving as the object representing a file for the
 * GraphQL routes.
 * @author - xlsson
 */

const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLBoolean,
    GraphQLList,
    GraphQLNonNull
} = require('graphql');

const CommentType = require("./comment.js");

const DocType = new GraphQLObjectType({
    name: 'Doc',
    description: 'This represents a doc',
    fields: () => ({
        filename: { type: GraphQLNonNull(GraphQLString) },
        code: { type: GraphQLNonNull(GraphQLBoolean) },
        title: { type: GraphQLNonNull(GraphQLString) },
        content: { type: GraphQLNonNull(GraphQLString) },
        comments: { type: GraphQLList(CommentType) },
        allowedusers: {
            type: GraphQLList(GraphQLString)
        },
        ownerName: { type: GraphQLNonNull(GraphQLString) },
        ownerEmail: { type: GraphQLNonNull(GraphQLString) }
    })
})

module.exports = DocType;
