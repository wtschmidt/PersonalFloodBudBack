const axios = require('axios');
require('dotenv').config();

const { ACCUWEATHER_APIKEY } = process.env;

const getRainfall = () => {
  return axios.get(`http://dataservice.accuweather.com/currentconditions/v1/348585?apikey=${ACCUWEATHER_APIKEY}&details=true`)
    .then((allWeather) => allWeather.data[0].PrecipitationSummary.Precipitation.Imperial.Value);
};


module.exports = {
  getRainfall,
};