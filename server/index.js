const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const path = require('path');
const { insertUser } = require('../database/dbindex');
const { getRainfall } = require('./APIhelpers');

const PORT = process.env.PORT || 8080;


const app = express();

app.use(bodyParser.json());


const angularStaticDir = path.join(__dirname, '../../flood/dist/flood');

app.use(express.static(angularStaticDir));

app.get('/route', (req, res) => {
  axios.get('https://api.openbrewerydb.org/breweries')
    .then((breweries) => {
      res.status(201).send(breweries.data);
    })
    .catch((err) => {
      console.log(err);
      res.send(500);
    });
});

app.get('/rainfall', (req, res) => {
  return getRainfall()
    .then((rainTotal) => {
      res.json(rainTotal);
    })
    .catch((err) => {
      console.log(err);
      res.status(500);
    });
});

app.get('/addUser', (req, res) => {
  insertUser()
    .then((results) => {
      console.log(results);
      res.send(200);
    })
    .catch((error) => {
      console.log(error);
      res.send(500);
    });
});


app.listen(PORT, () => {
  console.log('Floodbuddies be listening on: 8080');
});
