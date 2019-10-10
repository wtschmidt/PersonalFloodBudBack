const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const config = require('../config.js');
const { insertUser, createReport, getReports } = require('../database/dbindex');
const { getRainfall, createAddress } = require('./APIhelpers');

cloudinary.config(config);
const PORT = process.env.PORT || 8080;


const app = express();

app.use(bodyParser.json());


const angularStaticDir = path.join(__dirname, '../../flood/dist/flood');

app.use(express.static(angularStaticDir));

let reportData;

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

  // user is using current location
  // find the address of the user's location
  if (!req.body.report.location) {
    returnedAddress = await createAddress(req.body.report.latLng);
  }

  // user has image
  // get a url string from cloudinary for report img
  // send that report into the database
  if (req.body.report.img) {
    cloudinary.uploader.upload(req.body.report.img, (error, result) => result)
      .then((imgAssets) => {
        reportData = {
          desc: req.body.report.desc,
          latLng: req.body.report.latLng,
          img: imgAssets.secure_url,
          physicalAddress: returnedAddress || req.body.location,
        };
      })
      .then(() => {
        createReport(reportData);
      })
      .then(() => {
        res.status(201).send('got ya report...Allen');
      });
  } else {
    // user does not have image
    reportData = {
      desc: req.body.report.desc,
      latLng: req.body.report.latLng,
      img: null,
      physicalAddress: returnedAddress || req.body.location,
    };
    await createReport(reportData);
    res.status(201).send('got ya report...Allen');
  }
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

app.get('*', (req, res) => {
  res.status(200).sendFile(path.join(__dirname, '../../Floods/dist/flood/index.html'));
});

app.listen(PORT, () => {
  console.log('Floodbuddies be listening on: 8080');
});
