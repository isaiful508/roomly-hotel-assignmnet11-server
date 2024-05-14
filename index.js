const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.port || 5000

const app = express()

const corsOptions = {
  origin: ["http://localhost:5173",
    "http://localhost:5174",
    "https://roomly-assignment11.web.app",
    "https://roomly-assignment11.firebaseapp.com",

    "https://roomly.netlify.app"


  ],
  credentials: true,
  optionsSuccessStatus: 200,

}

app.use(cors(corsOptions));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Salam From server');
})

app.listen(port, () => {
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

    const bookingsCollection = client.db('roomlyDB').collection('bookings')


    //jwt generator
    app.post('/jwt', async(req, res) =>{
      const user = req.body
      // console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn:'2h'})

      res
      .cookie('token', token,{
        httpOnly: true,
        secure:false,
        sameSite: 'none'
      })
      .send({success: true})
    })







    //get all rooms
    app.get('/rooms', async (req, res) => {
      const result = await roomsCollection.find().toArray()

      res.send(result);
    })


    //update reviews

    app.patch('/room-details/:id', async (req, res) =>{
      const id = req.params.id;
      console.log(id);

      const { username, rating, comment, timestamp } = req.body.review
      // console.log(req.body);
      try {
        // Update the room document in the database
        const updatedRoom = await roomsCollection.reviews.updateOne(
            { _id: ObjectId(id) }, // Filter: Find the room by its ID
            { $push: { reviews: { username, rating, comment, timestamp } } }, // Update: Push the new review to the reviews array
            { returnOriginal: false } // Options: Return the updated document after the update
        );

        if (!updatedRoom.value) {
            return res.status(404).json({ error: 'Room not found' });
        }

        res.json({ message: 'Review added successfully', room: updatedRoom.value });
    } catch (error) {
        console.error('Error adding review:', error);
        res.status(500).json({ error: 'Failed to add review' });
    }

    })

    //rooms by id

    app.get('/room-details/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await roomsCollection.findOne(query);
      res.send(result);
    })



    // bookings
    app.post('/bookings', async (req, res) => {
      const booking = req.body;

      const result = await bookingsCollection.insertOne(booking);
      res.send(result);
    })


    //update available

    app.patch('/room-details/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true }

      const updateBooking = req.body;

      const updateDoc = {
        $set: {
          ...updateBooking
        }
      }
      const result = await roomsCollection.updateOne(query, updateDoc, options)
      res.send(result);


    });







    //extract booking by email
    app.get('/bookings/:email', async (req, res) => {
      const email = req.params.email;
      const query = { customerEmail: email }
      const result = await bookingsCollection.find(query).toArray();
      res.send(result);
    })

    //cancel bookings
    app.delete('/bookings/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: (id) }
      const result = await bookingsCollection.deleteOne(query);
      res.send(result);

    })

    //update booking date

    app.patch('/bookings/:id', async (req, res) => {

      const id = req.params.id;
      console.log(id);
      const query = { _id: (id) };


      // const { startDate } = req.body;
      const newDate = req.body.date;
      // console.log(startDate)
      console.log('fromserver', newDate);


      const updateDoc = {
        $set: { date: newDate }
      }
      const result = await bookingsCollection.updateOne(query, updateDoc)
      res.send(result);



    });


    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




