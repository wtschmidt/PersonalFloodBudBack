const AerisWeather = require('@aerisweather/javascript-sdk');
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const path = require('path');
const { insertUser, createReport, getReports } = require('../database/dbindex');
const { getRainfall, createAddress } = require('./APIhelpers');

const PORT = process.env.PORT || 8080;

const app = express();

app.use(bodyParser.json());

const aeris = new AerisWeather(process.env.AERIS_ID, process.env.AERIS_KEY);

// Property of Pesto -> API_KEY: AIzaSyAbJOa8X-CeBSal5VFPQPT1Qkhd-XTnf0s
// Property of Pesto -> Weather_KEY: yepxYOZ9rt28QeEGiMu0tW8K75qlkrHG

// const angularStaticDir = path.join(__dirname, '../../flood/dist/flood');
const angularStaticDir = path.join(__dirname, '../../Floods-thesis/dist/flood');

app.use(express.static(angularStaticDir));

let reportData;

app.get('/radar', (req, res) => {
  // aeris.api().endpoint('observations').place('new orleans,la').get()
  //   .then((result) => {
  //     const data = result.data.ob;
  //     console.log(`The current weather is ${data.weatherPrimary.toLowerCase()} and ${data.tempF} degrees.`);
  //   });
  aeris.views()
    .then((views) => {
      // const map = new views.InteractiveMap(document.getElementById('map'), {
      //   center: {
      //     lat: 39.0,
      //     lon: -95.5,
      //   },
      //   zoom: 4,
      //   strategy: 'google',
      //   accessToken: 'GOOGLE_KEY',
      //   layers: 'radar,alerts',
      //   timeline: {
      //     from: -6 * 3600,
      //     to: 0,
      //   },
      // });
      // console.log(map);
      res.json(views);
    });
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

app.get('/rainfall', (req, res) => getRainfall()
  .then((rainTotal) => {
    res.json(rainTotal);
  })
  .catch((err) => {
    console.log(err);
    res.status(500);
  }));

app.post('/submitReport', async (req, res) => {
  let returnedAddress;
  if (!req.body.location) {
    returnedAddress = await createAddress(req.body.report.latLng);
  }
  // .then((returnedAddress) => {
  reportData = {
    desc: req.body.report.desc,
    latLng: req.body.report.latLng,
    img: req.body.report.img || null,
    physicalAddress: returnedAddress || req.body.location,
  };
  // })
  // .then(() => {
  await createReport(reportData);
  // })
  // .then(() => {
  res.status(201).send('got ya report...Allen');
  // })
  // .catch((error) => {
  //   console.log(error);
  //   res.status(504).send('something went wrong with your report');
  // });
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

// GET req from frontend when user loads any page that renders a map.
// This fn gets all flood reports from db, and returns them to the user.
app.get('/floodReports', (req, res) => {
  getReports()
    .then((reports) => {
      console.log(reports);
      res.send(reports);
    })
    .catch(() => {
      res.send(500);
    });
  // const reports = await getReports();
  // res.status(201).json(reports.rows);
});

app.listen(PORT, () => {
  console.log('Floodbuddies be listening on: 8080');
});
