/**
 * @fileOverview CommentType class, serving as the object representing an array
 * of comments for the GraphQL routes.
 * @author - xlsson
 */

const {
    GraphQLObjectType,
    GraphQLInt,
    GraphQLString,
    GraphQLNonNull
} = require('graphql');

const CommentType = new GraphQLObjectType({
    name: 'Comment',
    description: 'This represents a comment',
    fields: () => ({
        nr: { type: GraphQLNonNull(GraphQLInt) },
        text: { type: GraphQLNonNull(GraphQLString) }
    })
})

module.exports = CommentType;
