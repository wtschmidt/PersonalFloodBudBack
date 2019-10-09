const express = require('express');
const axios = require('axios');
const turf = require('@turf/turf');
const bodyParser = require('body-parser');
const path = require('path');
const { insertUser, createReport, getReports } = require('../database/dbindex');
const { getRainfall, createAddress } = require('./APIhelpers');

const PORT = process.env.PORT || 8080;


const app = express();

app.use(bodyParser.json());


const angularStaticDir = path.join(__dirname, '../../flood/dist/flood');

app.use(express.static(angularStaticDir));

let reportData;

app.get('/map', (req, res) => {
  const point1 = turf.point([-90.080587, 29.977581]);
  const bufferedPoint1 = turf.buffer(point1, 0.05, { units: 'miles' });
  const point2 = turf.point([-90.082742, 29.979062]);
  const bufferedPoint2 = turf.buffer(point2, 0.05, { units: 'miles' });

  const start = [-90.087654, 29.982425];
  const end = [-90.073903, 29.973242];
  const options = {
    // obstacles: turf.polygon([[[-90.080587, 29.977581], [-90.080445, 29.977483], [-90.080514, 29.977549], [-90.080587, 29.977581]]]),
    obstacles: bufferedPoint1.geometry, bufferedPoint2.geometry,
  };

  const route = turf.shortestPath(start, end, options);
  // axios.get('https://api.openbrewerydb.org/breweries')
  //   .then((breweries) => {
  //     res.status(201).send(breweries.data);
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //     res.send(500);
  //   });
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
  reportData = {
    desc: req.body.report.desc,
    latLng: req.body.report.latLng,
    img: req.body.report.img || null,
    physicalAddress: returnedAddress || req.body.location,
  };
  await createReport(reportData);
  res.status(201).send('got ya report...Allen');
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
