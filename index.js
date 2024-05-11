const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express')
const cors = require('cors')
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000

// middleware
app.use(cors({
    origin: ["http://localhost:5173", "https://study-circle-auth.web.app", "https://study-circle-auth.firebaseapp.com"],
    credentials: true
  }))
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ctn12zm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const assignmentCollection = client.db("studyDB").collection("assignments");
    const submitCollection = client.db("studyDB").collection("submissions");

    app.get("/all-assignment", async(req, res) => {
        const cursor = assignmentCollection.find()
        const result = await cursor.toArray()
        res.send(result);
    })

    app.get("/all-assignment/:id", async(req, res) => {
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const result = await assignmentCollection.findOne(query);
        res.send(result)
    })

    app.post("/all-assignment", async(req, res) => {
        const assignmentData = req.body;
        const result = await assignmentCollection.insertOne(assignmentData)
        res.send(result)
    })

    app.put("/all-assignment/:id", async(req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const options = { upsert: true };
        const updatedAssignment = req.body;

        const updatedData = {
            $set: {
                ...updatedAssignment
            }
        }
        const result = await assignmentCollection.updateOne(filter, updatedData, options)
        res.send(result)
    })

    app.delete("/all-assignment/:id", async(req, res) => {
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const result = await assignmentCollection.deleteOne(query);
        res.send(result)
    })

    app.get("/posted/:email", async(req, res) => {
        const email = req.params.email;
        const query = {'a_creator.email': email}
        const result = await assignmentCollection.find(query).toArray()
        res.send(result)
    })

    app.post("/submission", async(req, res) => {
      const submitData = req.body;
      const result = await submitCollection.insertOne(submitData)
      res.send(result)
    })

    app.get("/attempted/:email", async(req, res) => {
      const email = req.params.email;
      const query = {'submitter.email': email}
      const result = await submitCollection.find(query).toArray()
      res.send(result)
    })
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Study Circle server running')
})

app.listen(port, () => {
  console.log(`Study Circle server running on port ${port}`)
})