const request = require('request');
const cronJob = require('cron').CronJob;
const weatherSecret = require('../../config/weather-secret.json');
const stringConfig = require('../../config/string-builder.json').weather;

const cronJobInterval = '*/1 * * * *';
const weatherUrl = `http://api.openweathermap.org/data/2.5/forecast?id=2759794&APPID=${weatherSecret.apiKey}&units=metric`;
let lastWeather;

function init() {
  createCronJob();
  console.log('Weather: initialised');
  return weatherUpdate();
}

function weatherUpdate() {
  return new Promise((resolve, reject) => {
    request(weatherUrl, (err, response, body) => {
      if(err) {
        reject(err);
      }

      if(body) {
        lastWeather = JSON.parse(body).list[0];
      }
      resolve();
    });
  });
}

function get() {
  return new Promise((resolve, reject) => {
    stringConfig.forEach(stringType => {
      if(between(lastWeather.main.temp, stringType.temp.min, stringType.temp.max)) {
        let string = stringType.base[Math.floor(Math.random() * stringType.base.length)];
        const addon = stringType.addon[lastWeather.weather[0].main];

        if(addon.length > 0) {
          string += addon[Math.floor(Math.random() * addon.length)];
        }

        return resolve({weather: string});
      }
    });
  });
}

function createCronJob() {
  new cronJob({
    cronTime: cronJobInterval,
    onTick: () => {
      console.log('Weather: update');
      weatherUpdate();
    },
    start: true
  });
}

function between(x, min, max) {
  return x >= min && x <= max;
}

module.exports = {
  init,
  weatherUpdate,
  get
}
