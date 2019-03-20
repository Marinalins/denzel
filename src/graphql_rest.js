const imdb = require('./imdb');
const DENZEL_IMDB_ID = 'nm0000243';

const Express = require("express");
const BodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;
const graphqlHTTP = require('express-graphql');
const { GraphQLSchema,
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
    GraphQLList
} = require('graphql');

const {movieType} = require('./movieType.js');

const CONNECTION_URL = "mongodb+srv://user:root2772@cluster-tuto-lrk1o.mongodb.net/test?retryWrites=true";
const DATABASE_NAME = "imdb";

var app = Express();

app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));

var database, collection;

app.listen(9292, () => {
    MongoClient.connect(CONNECTION_URL, { useNewUrlParser: true }, (error, client) => {
        if(error) throw error;
        database = client.db(DATABASE_NAME);
        collection = database.collection("movies");
        console.log("Connected to `" + DATABASE_NAME + "`!");
    });
});




// GRAPHQL

//Define the Query
const queryType = new GraphQLObjectType({
    name: 'Query',
    fields: {
        populate: {
          type: GraphQLInt,
          resolve: async function() {
            var movies = await imdb(DENZEL_IMDB_ID);
            await collection.insertMany(movies);
            return movies.length;
          }
        },
        random: {
          type: movieType,
          resolve: async function() {
            var res = await collection.aggregate([{$match: {metascore: {$gt: 70}}}, {$sample: {size:1}}]).toArray();
            return res[0];
          }
        },
        movie: {
          type: movieType,
          args: {
             id: { type: GraphQLString }
          },
          resolve: async function(source, args) {
            var myMovie = await collection.findOne({ "id": args.id }, { projection: { _id: 0 } });
            return myMovie;
          }
        },
        search: {
          type: new GraphQLList(movieType),
          args: {
            limit: { type: GraphQLInt },
            metascore: { type: GraphQLInt }
          },
          resolve: async function(source, args) {
            var limit = 5;
            var metascore = 0;
            if(args.limit) { limit = parseInt(args.limit); }
            if(args.metascore) { metascore = parseInt(args.metascore); }
            var query = { "metascore": { $gte: metascore } };
            var projection = { projection: { _id: 0 } };
            var sort = { "metascore": -1 };
            var denzelMovies = await collection.find(query, projection).limit(limit).sort(sort).toArray();
            return denzelMovies;
          }
        },
        review: {
          type: GraphQLString,
          args: {
            id: { type: GraphQLString },
            date: { type: GraphQLString },
            review: { type: GraphQLString }
          },
          resolve: async function(source, args){
            var myquery = { "id": args.id };
            var newvalues = { $set: { "date": args.date, "review": args.review } };
            await collection.updateOne(myquery, newvalues);
            return(args.date + ": " + args.review);
          }
        }
    }
});

// Define the Schema
const schema = new GraphQLSchema({ query: queryType });

//Setup the nodejs GraphQL server
app.use('/graphql', graphqlHTTP({
   schema: schema,
   graphiql: true,
}));






// REST ENDPOINTS

// GET /movies/populate
// Populate the database with all the Denzel's movies from IMDb.
app.get("/movies/populate", async (request, response) => {
    var movies = await imdb(DENZEL_IMDB_ID);
    collection.insertMany(movies, (error, result) => {
        if(error) throw error;
        response.json( {"total": result.insertedCount} );
    });
});


// GET /movies
// Fetch a random must-watch movie.
app.get("/movies", (request, response) => {
    collection.aggregate([{$match: {metascore: {$gt: 70}}}, {$sample: {size:1}}]).toArray(function(error,result){
      if(error) throw error;
      response.send(result[0]);
    });
});


// GET /movies/search
// Search for Denzel's movies.
app.get("/movies/search", (request, response) => {
  var limit = 5;
  var metascore = 0;
  if(request.query.limit) { limit = parseInt(request.query.limit); }
  if(request.query.metascore) { metascore = parseInt(request.query.metascore); }
  var query = { "metascore": { $gte: metascore } };
  var projection = { projection: { _id: 0 } };
  var sort = { "metascore": -1 };
  collection.find(query, projection).limit(limit).sort(sort).toArray(function(error,result){
    if(error) throw error;
    response.send(result);
  });
});


// GET /movies/:id
// Fetch a specific movie.
app.get("/movies/:id", (request, response) => {
    collection.findOne({ "id": request.params.id }, { projection: { _id: 0 } }, (error, result) => {
        if(error) throw error;
        response.send(result);
    });
});


// POST /movies/:id
// Save a watched date and a review.
app.post("/movies/:id", (request, response) => {
    var myquery = { "id": request.params.id };
    var newvalues = { $set: { "date": request.body.date, "review": request.body.review } };
    collection.updateOne(myquery, newvalues, function(error, result) {
      if (error) throw error;
      response.send(result);
    });
});
