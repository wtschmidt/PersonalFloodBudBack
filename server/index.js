const express = require('express');
const axios = require('axios');

const PORT = process.env.PORT || 8080;
const bodyParser = require('body-parser');
const cors = require('cors');
//the corsOptions below is copied from a website but I'm not totally sure how this works yet.
//this example is just so I can test if the server is actually up and running correctly.
var corsOptions = {
  origin: 'http://example.com',
  optionsSuccessStatus: 200
};

const app = express();

app.use(cors(corsOptions))

app.use(bodyParser.json())

app.get('/api/route', (req, res) => {
  axios.get('https://api.openbrewerydb.org/breweries')
    .then(breweries => {
      res.status(201).send(breweries)
    })
    .catch(err => {
      console.log(err);
      res.send(500);
    })
})

app.listen(PORT, () => {
  console.log('Floodbuddies be listening on: 8080');
});