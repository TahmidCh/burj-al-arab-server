const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config()
const admin = require('firebase-admin');


const port = 5000

const app = express()

app.use(cors());
app.use(bodyParser.json());

var serviceAccount = require("/cwd/projects/burj-al-arab-server/configs/burj-al-arab-98-firebase-adminsdk-d4ngz-39921f1516.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});



const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fbsgn.mongodb.net/BurjAlArab?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const bookings = client.db("BurjAlArab").collection("bookings");
  // perform actions on the collection object
  console.log('connected successfully');

  app.post('/addBooking', (req, res) => {
    const newBooking = req.body;
    bookings.insertOne(newBooking)
      .then(result => {
        res.send(result.insertedCount > 0);
      })
    console.log(newBooking);
  })

  app.get('/bookings', (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith('Bearer ')) {
      let idToken = bearer.split(' ')[1];
      // console.log({ idToken });
      // idToken comes from the client app
      admin.auth().verifyIdToken(idToken)
        .then(function (decodedToken) {
          let tokenEmail = decodedToken.email;
          const queryEmail= req.query.email;
          // console.log(tokenEmail, queryEmail);
          if (tokenEmail == queryEmail) {
            bookings.find({ email: queryEmail })
              .toArray((err, documents) => {
                res.send(documents)
              })
          }
          else{
            res.status(401).send('unauthorized access')
          }
          // ...
        })
        .catch((error) => {
          res.status(401).send('unauthorized access')
        });
    }
    else{
      res.status(401).send('unauthorized access')
    }

  })
});


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port)