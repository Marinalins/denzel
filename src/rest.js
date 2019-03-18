const imdb = require('./imdb');
const DENZEL_IMDB_ID = 'nm0000243';

const Express = require("express");
const BodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;

const CONNECTION_URL = "mongodb+srv://user:root2772@cluster-tuto-lrk1o.mongodb.net/test?retryWrites=true";
const DATABASE_NAME = "imdb";

var app = Express();

app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));

var database, collection;

app.listen(9292, () => {
    MongoClient.connect(CONNECTION_URL, { useNewUrlParser: true }, (error, client) => {
        if(error) {
            throw error;
        }
        database = client.db(DATABASE_NAME);
        collection = database.collection("movies");
        console.log("Connected to `" + DATABASE_NAME + "`!");
    });
});


// REST ENDPOINTS

// GET /movies/populate
// Populate the database with all the Denzel's movies from IMDb.
app.get("/movies/populate", async (request, response) => {
    var movies = await imdb(DENZEL_IMDB_ID);
    collection.insertMany(movies, (error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        response.json( {"total": result.insertedCount} );
    });
});


// GET /movies
// Fetch a random must-watch movie.
app.get("/movies", (request, response) => {
  collection.find({ "metascore": { $gte: 70 } }, { projection: { _id: 0 } }).toArray(function(error,result){
    if(error) throw error;
    var rand = Math.floor(Math.random() * result.length);
    var movie = result[rand];
    response.send(movie);
  })

});


// GET /movies/:id
// Fetch a specific movie.
app.get("/movies/:id", (request, response) => {
    collection.findOne({ "id": request.params.id }, { projection: { _id: 0 } }, (error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        response.send(result);
    });
});



// GET /movies/search
// Search for Denzel's movies.



// POST /movies/:id
// Save a watched date and a review.
