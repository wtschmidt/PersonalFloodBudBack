const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const path = require('path');

const PORT = process.env.PORT || 8080;


const app = express();

app.use(bodyParser.json());

// Property of Pesto -> API_KEY: AIzaSyAbJOa8X-CeBSal5VFPQPT1Qkhd-XTnf0s

// const angularStaticDir = path.join(__dirname, '../../flood/dist/flood');
const angularStaticDir = path.join(__dirname, '../../Floods-thesis/dist/flood');

app.use(express.static(angularStaticDir));
// app.use('/static', express.static(path.join(__dirname, '../../flood/dist')));
// app.use('api/', express.static(path.join(__dirname, '../../flood/dist')));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// app.use(express.static('../../flood/dist'));
// app.get('/api/*', (req, res) => {
//   res.sendFile(path.join(__dirname, '../../flood/dist'));
// });

app.get('/convert-address', (req, res) => {
  console.log(req.params);
  axios.get('');
});

app.get('/route', (req, res) => {
  axios.get('https://api.openbrewerydb.org/breweries')
    .then((breweries) => {
      // console.log(breweries);
      res.status(201).send(breweries.data);
    })
    .catch((err) => {
      console.log(err);
      res.send(500);
    });
});

// app.get('/find-routes', (req, res) => {
//   axios.get('')
// });

app.listen(PORT, () => {
  console.log('Floodbuddies be listening on: 8080');
});
