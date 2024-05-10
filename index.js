const express = require('express');
const cors = require('cors');
require ('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.port || 5000

const app = express()

const corsOptions = {
    origin : ['http://localhost:5173', 'http://localhost:5174'],
    credentials : true,
    optionsSuccessStatus : 200,

}

app.use(cors(corsOptions));
app.use(express.json());

app.get('/', (req, res)=>{
    res.send('Salam From server');
})

app.listen(port, ()=>{
    console.log(`Alhamdulillah Roomly server is running on port : ${port}`)
})





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster1.bhtyeej.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1`;


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

    const roomsCollection = client.db('roomlyDB').collection('rooms');

 //get all rooms
app.get('/rooms', async(req, res) =>{
    const result = await roomsCollection.find().toArray()

    res.send(result);
})

//rooms by id

app.get('/room-details/:id', async (req, res) =>{
    const id = req.params.id
    const query = {_id : new ObjectId(id)}
    const result = await roomsCollection.findOne(query);
    res.send(result);
  })
  








    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




