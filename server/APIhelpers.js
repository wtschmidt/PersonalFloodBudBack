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

const getLastFiveResults = () => new Promise((resolve, reject) => {
  connection.query(
    'SELECT setup, punchline, cocktail FROM (SELECT * FROM jokesAndCocktails ORDER BY id DESC LIMIT 5) sub ORDER BY id ASC',
    (err, topFive) => {
      if (err) {
        reject(err);
      } else {
        resolve(topFive);
      }
    },
  );
});
