// const AerisWeather = require('@aerisweather/javascript-sdk');
const express = require('express');
const env = require('dotenv');
const axios = require('axios');
const turf = require('@turf/turf');
const bodyParser = require('body-parser');
const path = require('path');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');


env.config();
const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const cloudinary = require('cloudinary').v2;
const {
  insertUser,
  createReport,
  getReports,
  getContacts,
  addContacts,
  findUser,
  findOrInsert,
  findGoogleUser,
  getUsersReports,
  deleteReport,
} = require('../database/dbindex');
const {
  getRainfall,
  createAddress,
  formatWaypoints,
  get311,
  elevationData,
  graphHopper,
} = require('./APIhelpers');
const config = require('../config');

cloudinary.config(config);
const PORT = process.env.PORT || 8080;

const app = express();

const {
  distRoute,
  DIST,
  DIST_INDEX,
} = process.env;

app.use(bodyParser.json({
  limit: '10mb',
}));
app.use(bodyParser.urlencoded({
  extended: true,
  limit: '10mb',
}));

// const angularStaticDir = path.join(__dirname, '../../Floods-thesis/dist/flood'); –––> Old stuff, pay no mind
const angularStaticDir = path.join(__dirname, `${DIST}`);

app.use(express.static(angularStaticDir));

app.use(session({
  secret: 'SESSION_SECRET',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: true,
  },
}));

app.use(passport.initialize()); // Used to initialize passport
app.use(passport.session()); // Used to persist login sessions

// Strategy config
passport.use(new GoogleStrategy({
  clientID: config.GOOGLE_CLIENT_ID,
  clientSecret: config.GOOGLE_CLIENT_SECRET,
  callbackURL: 'http://localhost:8080/auth/google/callback',
},
(accessToken, refreshToken, profile, cb) => {
  findOrInsert(profile);
  findGoogleUser(profile)
    .then((user) => {
      console.log(user);
      cb(null, user);
    })
    .catch((error) => {
      console.log(error);
      cb(null, error);
    });
}));

// Used to stuff a piece of information into a cookie
passport.serializeUser((user, done) => {
  done(null, user);
  // done(null, { id: 'what the ever loving fuck?' });
});

// Used to decode the received cookie and persist session
passport.deserializeUser((id, done) => {
  findUser(id)
    .then((user) => done(null, user))
    .catch((err) => console.log(err));
});

// passport.authenticate middleware is used here to authenticate the request
app.get('/auth/google', passport.authenticate('google', {
  scope: ['profile'], // Used to specify the required data
}));

// The middleware receives the data from Google and runs the function on Strategy config
app.get('/auth/google/callback', passport.authenticate('google', {
  failureRedirect: '/',
}), (req, res) => {
  res.redirect(`/?id=${req.user.rows[0].googleid}`);
});

// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

let reportData;

app.post('/getMap', async (req, res) => {
  const directions = {};
  const bufferArr = [];
  let mapped;
  let lowPoints;
  const reports = await getReports();
  let blockAreas = '';

  reports.forEach((report) => {
    if (report.latlng) {
      // const arr = report.latlng.split(',');
      blockAreas += (`${report.latlng},100;`);

      // const point = turf.point([parseFloat(arr[1]), parseFloat(arr[0])]);
      // const bufferedPoint = turf.buffer(point, 0.5, {
      //   units: 'miles',
      // });
      // bufferArr.push(bufferedPoint);
    }
  });

  await get311()
    .then((cityReports) => {
      console.log(cityReports);
      if (cityReports.length) {
        cityReports.forEach((report) => blockAreas += (`${report.geocoded_column.latitude},${report.geocoded_column.longitude},100;`));
        // cityReports.features.forEach((feature) => {

        //   const cityPoint = turf.buffer(feature, 0.5, {
        //     units: 'miles',
        //   });
        //   bufferArr.push(cityPoint);
      }
    });
  const blockString = blockAreas.slice(0, blockAreas.length - 1);
  const start = `${parseFloat(req.body.mapReqInfo.origin.lat)},${parseFloat(req.body.mapReqInfo.origin.lng)}`;
  const end = `${parseFloat(req.body.mapReqInfo.destination.lat)},${parseFloat(req.body.mapReqInfo.destination.lng)}`;
  await graphHopper(start, end, blockString)
    .then(async (response) => {
      let waypoints = response.data.paths[0].points.coordinates;
      let isSafe = false;
      while (!isSafe) {
        lowPoints = waypoints.filter((waypoint) => waypoint[2] < 2);
        if (!lowPoints.length) {
          isSafe = true;
        } else if (lowPoints.length) {
          lowPoints.forEach((point) => {
            blockAreas += (`${point[1]},${point[0]},100;`);
          });
          const newBlockString = blockAreas.slice(0, blockAreas.length - 1);
          const newpoints = await graphHopper(start, end, newBlockString);
          waypoints = newpoints.data.paths[0].points.coordinates;
        }
      }


      // lowPoints = waypoints.filter((waypoint) => waypoint[2] < 2.5);
      // if (lowPoints.length) {
      //   lowPoints.forEach((point) => {
      //     blockAreas += (`${point[1]},${point[0]},100;`);
      //   });
      //   const newBlockString = blockAreas.slice(0, blockAreas.length - 1);
      //   await graphHopper(start, end, newBlockString)
      // .then((newWaypoints) => {
      //       mapped = newWaypoints.data.paths[0].points.coordinates.map((eachPoint) => ({
      //         location: {
      //           lat: eachPoint[1],
      //           lng: eachPoint[0],
      //         },
      //       }));
      //       directions.waypoints = mapped;
      //       mapped.unshift({ location: { lat: req.body.mapReqInfo.origin.lat, lng: req.body.mapReqInfo.origin.lng } });
      //       mapped.push({ location: { lat: req.body.mapReqInfo.destination.lat, lng: req.body.mapReqInfo.destination.lng } });
      //       res.status(201).send(directions);
      //     });
      // } else {
      mapped = waypoints.map((point) => ({
        location: {
          lat: point[1],
          lng: point[0],
        },
      }));
      directions.waypoints = mapped;
      mapped.unshift({ location: { lat: req.body.mapReqInfo.origin.lat, lng: req.body.mapReqInfo.origin.lng } });
      mapped.push({ location: { lat: req.body.mapReqInfo.destination.lat, lng: req.body.mapReqInfo.destination.lng } });
      // let blockedArray = blockString.split(',');
      // console.log(blockedArray);
      // if(blockString.includes(end) || newBlockString.includes(end))
      res.status(201).send(directions);
    })
    .catch((error) => console.log(error));

  // cityReports.forEach((cityReport) => {
  //   const cityPoint = turf.point([cityReport.longitude, cityReport.latitude]);
  //   const cityBufferedPoint = turf.buffer(cityPoint, 0.5, { units: 'miles' });
  //   bufferArr.push(cityBufferedPoint);


  // const obstacles = await turf.featureCollection(bufferArr);

  // going to need to be the origin and desination lat/lng from the http req from front end,
  // with obstacles = sections that are flood reports
  // const start = [parseFloat(req.body.mapReqInfo.origin.lng), parseFloat(req.body.mapReqInfo.origin.lat)];
  // const end = [parseFloat(req.body.mapReqInfo.destination.lng), parseFloat(req.body.mapReqInfo.destination.lat)];
  // const options = {
  //   obstacles,
  // };

  // const route = await turf.shortestPath(start, end, options);

  // const routeCoordsArray = route.geometry.coordinates;

  // // format coordinates from routeCoordsArray to be in appropriate form for snapToRoads API below
  // const allCoords = await formatWaypoints(routeCoordsArray);

  // snap the coords from allCoords to roads, using google's snapToRoads API,
  // take returned lat/lng of origin, destin from that API req and send it to google agm directions
  // send the return of that to front end to render on the client side map

  // await axios.get(`https://roads.googleapis.com/v1/snapToRoads?path=${allCoords}&interpolate=false&key=AIzaSyDCQchp8XgMTPdeHQG_4EJ8ytTv7bWPP3c`)
  //   .then((response) => {
  //     // I don't think we'll need these next two lines that set props of origin and destination in response, but leaving them for now, just in case
  //     // directions.origin = { lat: response.data.snappedPoints[0].location.latitude, lng: response.data.snappedPoints[0].location.longitude };
  //     // directions.destination = { lat: response.data.snappedPoints[response.data.snappedPoints.length - 1].location.latitude, lng: response.data.snappedPoints[response.data.snappedPoints.length - 1].location.longitude };
  //     mapped = response.data.snappedPoints.slice(1, response.data.snappedPoints.length - 1).map((points) => ({
  //       location: {
  //         lat: points.location.latitude,
  //         lng: points.location.longitude,
  //       },
  //     }));
  //   });
  // const coordsForElevation = mapped.map((coord) => [coord.location.lat, coord.location.lng]);
  // await elevationData(coordsForElevation)
  //   .then((results) => {
  //     lowPoints = results.filter((result) => result.elevation < 0.5);
  //   });
  // if (lowPoints.length) {
  //   lowPoints.forEach((point) => {
  //     const elevationPoint = turf.point([point.location.lng, point.location.lat]);
  //     const bufferedElevationPoint = turf.buffer(elevationPoint, 0.1, {
  //       units: 'miles',
  //     });
  //     bufferArr.push(bufferedElevationPoint);
  //   });

  //   const newObstacles = turf.featureCollection(bufferArr);
  //   const newOptions = {
  //     obstacles: newObstacles,
  //   };
  //   const newRoute = turf.shortestPath(start, end, newOptions);
  //   const newRouteCoordsArray = newRoute.geometry.coordinates;
  //   const newAllCoords = await formatWaypoints(newRouteCoordsArray);
  //   await axios.get(`https://roads.googleapis.com/v1/snapToRoads?path=${newAllCoords}&interpolate=false&key=AIzaSyDCQchp8XgMTPdeHQG_4EJ8ytTv7bWPP3c`)
  //     .then((response) => {
  //       // I don't think we'll need these next two lines that set props of origin and destination in response, but leaving them for now, just in case
  //       // directions.origin = { lat: response.data.snappedPoints[0].location.latitude, lng: response.data.snappedPoints[0].location.longitude };
  //       // directions.destination = { lat: response.data.snappedPoints[response.data.snappedPoints.length - 1].location.latitude, lng: response.data.snappedPoints[response.data.snappedPoints.length - 1].location.longitude };
  //       const newMapped = response.data.snappedPoints.slice(1, response.data.snappedPoints.length - 1).map((points) => ({
  //         location: {
  //           lat: points.location.latitude,
  //           lng: points.location.longitude,
  //         },
  //       }));
  //       directions.waypoints = newMapped;
  //       res.status(201).send(directions);
  //     });
  // } else {
  //   directions.waypoints = mapped;
  //   res.status(201).send(directions);
  // }


  // The code below will also work, but it seems to give less accurate results.
  // Leaving the code for now just in case we need to use it after we get elevation into the maps, too.

  // // //add origin prop in directions that takes first lat/lng from routeCoordsArray as beginning point
  // directions.origin = { lat: routeCoordsArray[0][1], lng: routeCoordsArray[0][0] };
  // // //add destination prop in directions that takes last lat/lng from routeCoordsArray as ending point
  // directions.destination = { lat: routeCoordsArray[routeCoordsArray.length - 1][1], lng: routeCoordsArray[routeCoordsArray.length - 1][0] };
  // // //chop off first and last lat/lng combos from routeCoordsArray so that only the middle points will be used as waypoints in directions variable
  // routeCoordsArray.shift();
  // routeCoordsArray.pop();

  // // //loop through all remaining lat/lngs in routeCoordsArray and set them up as waypoints in the directions variable
  // const result = routeCoordsArray.map((coordPair) => ({ location: { lat: coordPair[1], lng: coordPair[0] } }));
  // const points = [result[4], result[5], result[6], result[7], result[8], result[9]];
  // directions.waypoints = result;
  // // directions.waypoints = points;

  // // send back directions object with origin, desintation, and waypoints formatted for use with agm
  // res.status(201).send(directions);
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
  const userInfo = await findGoogleUser(req.body.report);
  // user is using current location
  // find the address of the user's location
  if (!req.body.report.location) {
    returnedAddress = await createAddress(req.body.report.latLng);
  }

  // user has image
  // get a url string from cloudinary for report img
  // send that report into the database
  if (req.body.report.img) {
    cloudinary.uploader.upload(req.body.report.img, (error, result) => {
      console.log(result);
      return result;
    })
      .then((imgAssets) => {
        reportData = {
          desc: req.body.report.desc,
          latLng: req.body.report.latLng,
          img: imgAssets.secure_url,
          physicalAddress: returnedAddress || req.body.report.location,
          id: userInfo.id,
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
      physicalAddress: returnedAddress || req.body.report.location,
      id: userInfo.id,
    };
    await createReport(reportData);
    res.status(201).send('got ya report...Allen');
  }
});

app.get('/getContacts', async (req, res) => {
  console.log(req.query);
  const userInfo = await findGoogleUser(req.query);
  getContacts(userInfo.rows[0])
    .then((contacts) => {
      res.send(contacts);
    })
    .catch((error) => {
      res.send(error);
    });
});

app.post('/submitContacts', async (req, res) => {
  console.log(req.body.contacts);
  const userInfo = await findGoogleUser(req.body.contacts);
  const contacts = {
    user_id: userInfo.rows[0].id,
    name1: req.body.contacts.name1,
    name2: req.body.contacts.name2,
    name3: req.body.contacts.name3,
    phone1: req.body.contacts.phone1,
    phone2: req.body.contacts.phone2,
    phone3: req.body.contacts.phone3,
  };

  await addContacts(contacts)
    .then(() => {
      res.send(201);
    })
    .catch(() => {
      res.send(500);
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

app.post('/submitMessage', async (req, res) => {
  console.log(req);
  const message = {};
  const latLng = `${req.body.message.lat},${req.body.message.lng}`;
  message.user = await findGoogleUser(req.body.message);
  message.address = await createAddress(latLng);
  message.contacts = await getContacts(message.user.rows[0]);
  message.contacts.forEach((contact) => {
    client.messages.create({
      body: `${req.body.message.message} - This is my current location: ${message.address}`,
      from: process.env.TWILIO_NUMBER,
      to: contact.phone_number,
    })
      .then((test) => {
        console.log(test);
      });
  });

  console.log(message);
  res.send(200);
});

app.get('/userInfo', ((req, res) => {
  findGoogleUser(req.query).then((user) => res.send(user)).catch((err) => res.send(err));
}));

app.get('/reportLocation/:{latlng}', ((req, res) => {
  createAddress(req.param.latlng).then((result) => {
    console.log(result);
    res.send(result);
  });
}));

app.get('/deleteReport', ((req, res) => {
  console.log("THIS IS IT!", req.query);
  deleteReport(req.query.id)
    .catch((err) => console.error(err));
}));

app.get('*', (req, res) => {
  // res.status(200).sendFile(path.join(__dirname, '../../Floods-thesis/dist/flood/index.html')); ––––> Just in case;
  res.status(200).sendFile(path.join(__dirname, `${DIST_INDEX}`));
});

app.listen(PORT, () => {
  console.log('Floodbuddies be listening on: 8080');
});

// LEAVING lines below right now, just for reference. Will delete later.
// const slimBuffer = bufferArr.splice(0, 15);
// const point1 = turf.point([-90.078370, 29.976051]);
// const bufferedPoint1 = turf.buffer(point1, 0.2, { units: 'miles' });
// const point2 = turf.point([-90.072157, 29.971722]);
// const bufferedPoint2 = turf.buffer(point2, 0.2, { units: 'miles' });

// const obstacles = turf.featureCollection([bufferedPoint1, bufferedPoint2]);
