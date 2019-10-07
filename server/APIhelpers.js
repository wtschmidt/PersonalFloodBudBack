const axios = require('axios');
require('dotenv').config();

const { ACCUWEATHER_APIKEY } = process.env;

const getRainfall = () => {
  return axios.get(`http://dataservice.accuweather.com/currentconditions/v1/348585?apikey=${ACCUWEATHER_APIKEY}&details=true`)
    .then((allWeather) => allWeather.data[0].PrecipitationSummary.Precipitation.Imperial.Value);
};

const convertToGeo = (latLng) => {
  return axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latLng}&key=AIzaSyDCQchp8XgMTPdeHQG_4EJ8ytTv7bWPP3c`)
};

module.exports = {
  getRainfall,
  convertToGeo,
};