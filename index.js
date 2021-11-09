const express = require("express");
const { MongoClient } = require('mongodb');
require("dotenv").config();
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;


// Middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xu78k.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const run = async () => {
    try {
        await client.connect();
        const database = client.db("cars_portal");
        const carCollection = database.collection("cars");
        const usersCollection = database.collection("users");

        app.get('/', async (req, res) => {

        });
    }
    finally {
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send("Server is Running");
});

app.listen(port, _ => {
    console.log("Server is running on port:", port);
});