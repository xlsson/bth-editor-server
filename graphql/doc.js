const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLNonNull
} = require('graphql');

const DocType = new GraphQLObjectType({
    name: 'Doc',
    description: 'This represents a doc',
    fields: () => ({
        filename: { type: GraphQLNonNull(GraphQLString) },
        title: { type: GraphQLNonNull(GraphQLString) },
        content: { type: GraphQLNonNull(GraphQLString) },
        allowedusers: {
            type: GraphQLList(GraphQLString)
        },
        ownerName: { type: GraphQLNonNull(GraphQLString) },
        ownerEmail: { type: GraphQLNonNull(GraphQLString) }
    })
})

module.exports = DocType;
