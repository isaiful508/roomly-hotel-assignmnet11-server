const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.port || 5000

const app = express()


//middle ware
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
app.use(cookieParser());


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

//middlewares 
const logger = async (req, res, next) => {
  console.log('called', req.host, req.originalUrl)
  next();
}

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  console.log('value of token in middleware', token)
  if (!token) {
    return res.status(401).send({ message: 'not authorized' })
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {

    //error
    if (error) {
      console.log(error);
      return res.status(401).send({ message: "unauthorized" })
    }
    //if token is valid 

    console.log('value in the token', decoded)
    req.user = decoded;


    next();
  })


}



async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const roomsCollection = client.db('roomlyDB').collection('rooms');

    const bookingsCollection = client.db('roomlyDB').collection('bookings')

    const reviewsCollection = client.db('roomlyDB').collection('reviews')


    //jwt generator
    app.post('/jwt', logger, async (req, res) => {
      const user = req.body
      console.log(user);

      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '24h'
      });

      res
        .cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',


          // httpOnly: true,
          // secure: false,

        })
        .send({ success: true })
    })


    app.post('/logout', async (req, res) => {
      const user = req.body;
      console.log('logging out', user)
      res.clearCookie('token', { maxAge: 0 }).send({ success: true })
    })



    // app.post('/jwt', async (req, res) => {
    //   const user = req.body;
    //   console.log('user for the token', user)
    // })




    //get all rooms
    app.get('/rooms', logger, async (req, res) => {

      const { minPrice, maxPrice } = req.query;

      let query = {};
      if (minPrice && maxPrice) {
        query.pricePerNight = {
          $gte: parseFloat(minPrice),
          $lte: parseFloat(maxPrice)
        };
      }



      const result = await roomsCollection.find(query).toArray()

      res.send(result);
    })


    //post reviews

    app.post('/reviews', async(req, res) =>{
      const reviews = req.body;
      console.log(reviews);
      const result = await reviewsCollection.insertOne(reviews);
      res.send(result)
    })

    //get all reviews
    
    app.get('/reviews', async (req, res) => {
      try {
        const allReviews = await reviewsCollection.find({}).toArray();
        res.send(allReviews);
      } catch (error) {
        console.error('Error fetching all reviews:', error);
        res.status(500).send({ message: 'Server error' });
      }
    });
  
    //get reviews by roomid 

    app.get('/reviews/:roomId', async (req, res) => {

      const roomId = req.params.roomId;  
      const query = { roomId: roomId };  
    
      try {

        const result = await reviewsCollection.find(query).toArray(); 

        if (result.length > 0) {
          res.send(result);  
        } else {
          res.status(404).send({ message: 'No reviews found for this room' });  
        }
      } catch (error) {
        res.status(500).send({ message: 'Server error', error }); 
      }

    });
    


    //rooms by id

    app.get('/room-details/:id',  logger, async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await roomsCollection.findOne(query);
      res.send(result);
    })



    // bookings
    app.post('/bookings', logger, async (req, res) => {
      const booking = req.body;
      // console.log('cookie from bokking', req.cookies)

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

    app.get('/bookings/:email',  logger, async (req, res) => {
      const email = req.params.email;
      // console.log('cookie from booking email', req.cookies.token)
      console.log('user in the valid token', req.user)

      // if (email !== req.user.email) {
      //   return res.status(403).send({ message: 'forbidden access' })
      // }



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
      // console.log(id);
      const query = { _id: (id) };


      // const { startDate } = req.body;
      const newDate = req.body.date;
      // console.log(startDate)
      // console.log('fromserver', newDate);


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




