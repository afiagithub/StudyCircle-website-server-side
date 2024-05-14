const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000

// middleware
app.use(cors({
  origin: ["http://localhost:5173", "https://study-circle-auth.web.app", "https://study-circle-auth.firebaseapp.com"],
  credentials: true
}))
app.use(express.json())
app.use(cookieParser())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ctn12zm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: 'not authorized' })
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
    if (error) {
      return res.status(401).send({ message: 'not authorized' })
    }
    // console.log('value token: ', decoded);
    req.user = decoded;
  })
  next();
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const assignmentCollection = client.db("studyDB").collection("assignments");
    const submitCollection = client.db("studyDB").collection("submissions");

    // jwt token create api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      // console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res
        .cookie('token', token, cookieOptions)
        .send({ success: true })
    })

    app.get("/all-assignment", async (req, res) => {
      const cursor = assignmentCollection.find()
      const result = await cursor.toArray()
      res.send(result);
    })

    app.get("/assignments/:difficulty", async (req, res) => {
      const diff = req.params.difficulty;
      const query = { difficulty: diff }
      const result = await assignmentCollection.find(query).toArray()
      res.send(result);
    })

    app.get("/all-assignment/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await assignmentCollection.findOne(query);
      res.send(result)
    })

    app.post("/all-assignment", async (req, res) => {
      const assignmentData = req.body;
      const result = await assignmentCollection.insertOne(assignmentData)
      res.send(result)
    })

    app.put("/all-assignment/:id", async (req, res) => {
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

    app.delete("/all-assignment/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await assignmentCollection.deleteOne(query);
      res.send(result)
    })

    app.get("/posted/:email", verifyToken, async (req, res) => {
      const tokenData = req.user
      // console.log(tokenData);
      const email = req.params.email;
      if (email !== req.user.email) {
        return res.status(403).send({ message: 'forbidden' })
      }
      const query = { 'a_creator.email': email }
      const result = await assignmentCollection.find(query).toArray()
      res.send(result)
    })

    app.post("/submission", async (req, res) => {
      const submitData = req.body;
      const result = await submitCollection.insertOne(submitData)
      res.send(result)
    })

    app.get("/submission/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await submitCollection.findOne(query)
      res.send(result)
    })

    app.put("/submission/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const options = { upsert: true };
      const updatedSubmission = req.body;
      const updatedData = {
        $set: {
          ...updatedSubmission
        }
      }
      const result = await submitCollection.updateOne(filter, updatedData, options)
      res.send(result)
    })

    app.get("/attempted/:email", verifyToken, async (req, res) => {
      const tokenData = req.user
      // console.log(tokenData);
      const email = req.params.email;
      if (email !== req.user.email) {
        return res.status(403).send({ message: 'forbidden' })
      }
      const query = { 'submitter.email': email }
      const result = await submitCollection.find(query).toArray()
      res.send(result)
    })

    app.get("/pending/:email", verifyToken, async (req, res) => {
      const tokenData = req.user
      // console.log(tokenData);
      const email = req.params.email;
      if (email !== req.user.email) {
        return res.status(403).send({ message: 'forbidden' })
      }
      const query = { creator_email: email }
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