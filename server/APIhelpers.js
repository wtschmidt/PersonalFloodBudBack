const axios = require('axios');
require('dotenv').config();

const { ACCUWEATHER_APIKEY, GOOGLE_APIKEY } = process.env;

const getRainfall = () => axios.get(`http://dataservice.accuweather.com/currentconditions/v1/348585?apikey=${ACCUWEATHER_APIKEY}&details=true`)
  .then((allWeather) => allWeather.data[0].PrecipitationSummary.Precipitation.Imperial.Value);

const createAddress = (coord) =>
  // need to take latLng coord and convert to physical address in words through API call to
  // google geoCode.
  axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${coord}&key=${GOOGLE_APIKEY}`)
    .then((physicalAddress) => 
    physicalAddress.data.results[0].formatted_address);

module.exports = {
  getRainfall,
  createAddress,
};
