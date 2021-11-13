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


// Verify token
const admin = require("firebase-admin");
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const verifyToken = async (req, res, next) => {
    if (req?.headers?.authorization?.startsWith('Bearer ')) {
        const token = req.headers.authorization.split(' ')[1];
        try {
            const decodedUser = await admin.auth().verifyIdToken(token);
            req.decodedEmail = decodedUser.email;
        }
        catch {

        }
    }
    next();
}

const run = async () => {
    try {
        await client.connect();
        const database = client.db("cars_portal");
        const carCollection = database.collection("cars");
        const usersCollection = database.collection("users");
        const ordersCollection = database.collection("orders");
        const reviewCollection = database.collection("reviews");

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

        // verify admin
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
        app.put('/users/admin', verifyToken, async (req, res) => {
            const user = req.body;
            const requester = req.decodedEmail;
            if (requester) {
                const requesterAccount = await usersCollection.findOne({ email: requester });
                if (requesterAccount.role === "admin") {
                    const filter = { email: user.email };
                    const updateDoc = { $set: { role: "admin" } };
                    const result = await usersCollection.updateOne(filter, updateDoc);
                    res.json(result);
                }
            }
            else {
                res.status(403).json({ message: "You don't any have access to make admin!" })
            }
        });

        // Get my orders
        app.get('/myOrders/:email', async (req, res) => {
            const email = req.params.email;
            const result = await ordersCollection.find({ email: email }).toArray();
            res.json(result);
        });

        // Get all orders
        app.get('/allOrders', async (req, res) => {
            const result = await ordersCollection.find({}).toArray();
            res.json(result);
        });

        // Delete an order
        app.delete('/cancelOrder/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const result = await ordersCollection.deleteOne({ _id: id });
            console.log(result);
            res.json(result);
        });

        // Update Status
        app.put('/updateStatus/:id', async (req, res) => {
            const id = req.params.id;
            const newStatus = req.body.updatedStatus;
            const filter = { _id: id };
            const result = await ordersCollection.updateOne(filter, {
                $set: { status: newStatus }
            });
            res.json(result);
        });

        // Delete a product
        app.delete('/deleteService/:id', async (req, res) => {
            const id = req.params.id;
            const result = await carCollection.deleteOne({ _id: ObjectId(id) });
            res.json(result);
        });

        // Add a review
        app.post('/addReview', async (req, res) => {
            const result = await reviewCollection.insertOne(req.body);
            res.json(result);
        });

        // Get reviews
        app.get('/reviews', async (req, res) => {
            const result = await reviewCollection.find({}).toArray();
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