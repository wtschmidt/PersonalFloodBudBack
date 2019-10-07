const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const path = require('path');
const {
  insertUser,
  createReport,
  getReports
} = require('../database/dbindex');
const {
  getRainfall,
  createAddress
} = require('./APIhelpers');

const PORT = process.env.PORT || 8080;


const app = express();

app.use(bodyParser.json());

const {
  distRoute,
} = process.env;

const angularStaticDir = path.join(__dirname, distRoute);

app.use(express.static(angularStaticDir));

let reportData;

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