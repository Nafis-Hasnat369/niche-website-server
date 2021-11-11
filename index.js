const express = require("express");
const { MongoClient } = require('mongodb');
require("dotenv").config();
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const ObjectId = require("mongodb").ObjectId;

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
        const ordersCollection = database.collection("orders");

        // Add a service

        app.post('/addServices', async (req, res) => {
            const result = await carCollection.insertOne(req.body);
            res.json(result);
        });

        // Get all services
        app.get('/allServices', async (req, res) => {
            const result = await carCollection.find({}).toArray();
            res.json(result);
        });

        // Get single service
        app.get('/singleProduct/:id', async (req, res) => {
            const id = req.params.id;
            const result = await carCollection.find({ _id: ObjectId(id) }).toArray();
            res.json(result[0]);
        });

        // ConfirmOrder
        app.post('/confirmOrder', async (req, res) => {
            const data = req.body;
            const result = await ordersCollection.insertOne(data);
            res.json(result);
        });

        // Save a user
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.json(result);
        });

        // set admin
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin })
        });

        // Set user
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.json(result);
        });

        // Make admin
        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const option = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, option);
            res.json(result);
        });

        // Get my orders
        app.get('/myOrders/:email', async (req, res) => {
            const email = req.params.email;
            const result = await ordersCollection.find({ email: email }).toArray();
            res.json(result);
        });
        // Delete an order
        app.delete('/cancelOrder/:id', async (req, res) => {
            const id = req.params.id;
            const result = await ordersCollection.deleteOne({ _id: ObjectId(id) });
            console.log(result);
            res.json(result);
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