const axios = require('axios');
require('dotenv').config();

const {
  ACCUWEATHER_APIKEY,
  GOOGLE_APIKEY,
  CARIN_GOOGLE_APIKEY,
} = process.env;

const googleMapsClient = require('@google/maps').createClient({
  key: `${CARIN_GOOGLE_APIKEY}`,
  Promise,
});

const getRainfall = () => axios.get(`http://dataservice.accuweather.com/currentconditions/v1/348585?apikey=${ACCUWEATHER_APIKEY}&details=true`)
  .then((allWeather) => allWeather.data[0].PrecipitationSummary.Precipitation.Imperial.Value);

const createAddress = (coord) => {
  // need to take latLng coord and convert to physical address in words through API call to
  // google geoCode.
  axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${coord}&key=${GOOGLE_APIKEY}`)
    .then((physicalAddress) => {
      console.log('WE WANT THIS:', physicalAddress);
      return physicalAddress.data.results[0].formatted_address;
    })
    .catch((err) => {
      console.error(err);
    });
};

const get311 = () => new Promise((resolve, reject) => {
  const currentDate = new Date();
  const dateTime = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}T${currentDate.getHours()}:00:00`;
  const prevDateTime = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}T${currentDate.getHours() - 4}:00:00`;
  console.log(dateTime, prevDateTime);
  // axios.get(`https://data.nola.gov/resource/2jgv-pqrq.json?$where=date_created between '${prevDateTime}' and '${dateTime}'&request_type=Roads/Drainage`)
  axios.get("https://data.nola.gov/resource/2jgv-pqrq.json?$where=date_created between '2019-10-10T09:00:00' and '2019-10-11T12:00:00'&request_type=Roads/Drainage")
    .then((response) => {
      console.log(response);
      resolve(response.data);
    });
});


const formatWaypoints = ((routeCoordsArray) => {
  let string = '';
  for (let i = 0; i < routeCoordsArray.length; i += 1) {
    if (i === routeCoordsArray.length - 1) {
      string += `${parseFloat(routeCoordsArray[i][1])},${parseFloat(routeCoordsArray[i][0])}`;
      // string.slice(0, (string.length - 1));
    } else {
      string += `${parseFloat(routeCoordsArray[i][1])},${parseFloat(routeCoordsArray[i][0])}|`;
    }
  }
  return string;
  // routeCoordsArray.forEach(coord => {
  //   string += parseFloat(coord[1]) + ',' + parseFloat(coord[0]) + "|"
  // });
});

const elevationData = ((path) => new Promise((resolve, reject) => {
  googleMapsClient.elevationAlongPath({
      path,
      samples: path.length,
    })
    .asPromise()
    .then((response) => {
      console.log(response.json.results);
      resolve(response.json.results);
    })
    .catch((err) => {
      console.log(err);
    });
}));

module.exports = {
  getRainfall,
  createAddress,
  formatWaypoints,
  get311,
  elevationData,
};