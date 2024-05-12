const express = require('express');
const cors = require('cors');
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

    //get all rooms
    app.get('/rooms', async (req, res) => {
      const result = await roomsCollection.find().toArray()

      res.send(result);
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

  //   app.post('/bookings', async(req, res) => {
  //     const booking = req.body;
  
  //     try {
  //         // Insert booking into bookings collection
  //         const bookingResult = await bookingsCollection.insertOne(booking)
  //         const bookedRoomId = booking._id;
  
  //         // Update availability of the booked room to "Not available" in the rooms collection
  //         await roomsCollection.updateOne({
  //             _id: ObjectId(bookedRoomId)
  //         }, {
  //             $set: {
  //               availability: 'Not-Available'
  //             }
  //         });
  //         res.status(201).send('Booking Successfully');
  
  //     } catch (error) {
  //         console.error('Error booking', error);
  //         res.status(500).send('Internal error');
  //     }
  // });
//   app.put('/room-details/:id', async (req, res) => {
//     const roomId = req.params.id; // Extract room ID from request parameters
//     const updatedAvailability = 'Not available'; // Update availability to "Not available"
//     const filter = { _id: new ObjectId(roomId) }; // Ensure to convert roomId to ObjectId
//     const update = { availability: updatedAvailability };

//     try {
//         await roomsCollection.updateOne(filter, { $set: update });
//         res.status(200).send('Room availability updated successfully');
//     } catch (error) {
//         console.error('Error updating room availability:', error);
//         res.status(500).send('Internal server error');
//     }
// });







    //extract booking by email
    app.get('/bookings/:email', async (req, res) => {
      const email = req.params.email;
      const query = { customerEmail: email }
      const result = await bookingsCollection.find(query).toArray();
      res.send(result);
    })

    //cancel bookings
    app.delete('/bookings/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id:  (id)}
      const result = await bookingsCollection.deleteOne(query);
      res.send(result);

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




