const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const path = require('path');
const { insertUser } = require('../database/dbindex');
const { getRainfall, convertToGeo } = require('./APIhelpers');

const PORT = process.env.PORT || 8080;


const app = express();

app.use(bodyParser.json());

// Property of Pesto -> API_KEY: AIzaSyAbJOa8X-CeBSal5VFPQPT1Qkhd-XTnf0s
// Property of Pesto -> Weather_KEY: yepxYOZ9rt28QeEGiMu0tW8K75qlkrHG

// const angularStaticDir = path.join(__dirname, '../../flood/dist/flood');
const angularStaticDir = path.join(__dirname, '../../Floods-thesis/dist/flood');

app.use(express.static(angularStaticDir));

app.get('/convert-address/:latLng', (req, res) => {
  console.log(req.params);
  return convertToGeo(req.params.latLng);
  // axios.get('');
});

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
