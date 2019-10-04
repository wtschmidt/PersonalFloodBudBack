const axios = require('axios');
const dotenv = require('dotenv').config();

const getRainfall = () => {
  axios.get(`http://dataservice.accuweather.com/currentconditions/v1/348585?apikey=${ACCUWEATHER_APIKEY}`)
    .then((rain) => rain);
};
