const {
    GraphQLObjectType,
    GraphQLID,
    GraphQLString,
    GraphQLInt,
    GraphQLFloat
} = require('graphql');

// Define Movie Type
movieType = new GraphQLObjectType({
    name: 'Movie',
    fields: {
        link: { type: GraphQLString },
        id: { type: GraphQLString },
        metascore: { type: GraphQLInt },
        poster: { type: GraphQLString },
        rating: { type: GraphQLFloat },
        synopsis: { type: GraphQLString },
        title: { type: GraphQLString },
        votes: { type: GraphQLFloat },
        year: { type: GraphQLInt },
    }
});


exports.movieType = movieType;
