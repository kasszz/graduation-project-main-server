const weatherContext = require('./context/weather.js');
const greetingContext = require('./context/greeting.js');
const stringConfig = require('../config/string-builder.json');

function init() {
  return new Promise((resolve, reject) => {
    const promisses = [
      weatherContext.init()
    ];

    Promise.all(promisses)
      .then(data => {
        resolve();
      })
  })
}

function generateWelcomeString(name, controleur) {
  const promisses = [greetingContext.get(), weatherContext.get()];

  return Promise.all(promisses)
    .then(toObject)
    .then(data => {
      data.name = name;
      data.controleur = controleur;

      return Promise.resolve({welcome: generateString(stringConfig.welcomeString, data)});
    })
    .catch(err => {
      console.error(err);
    });
}

function generateInstructionString(name, controleur) {
  data = {};
  data.name = name;
  data.controleur = controleur;

  return Promise.resolve({instruction: generateString(stringConfig.instructionString, data)});
}

function generateDontWantToPlayString(name, controleur) {
  data = {};
  data.name = name;
  data.controleur = controleur;

  return Promise.resolve({dontWantToPlay: generateString(stringConfig.dontWantToPlayString, data)});
}

function generateGameOverString(name, controleur, score, rank, highscore) {
  let string;
  let data = {};
  data.name = name;
  data.controleur = controleur;
  data.score = score;
  data.rank = rank;
  data.highscoreName = highscore.name;
  data.highscoreScore = highscore.score;
  data.highscoreDifference = score - highscore.score;

  console.log(data);

  if(score === highscore.score) {
    string = generateString(stringConfig.gameOverStartString, data) + generateString(stringConfig.sameAsHighscoreString, data) + generateString(stringConfig.gameOverEndString, data);
  } else if(score > highscore.score) {
    string = generateString(stringConfig.gameOverStartString, data) + generateString(stringConfig.gotHighscoreString, data) + generateString(stringConfig.gameOverEndString, data);
  } else {
    string = generateString(stringConfig.gameOverStartString, data) + generateString(stringConfig.didntGetHighscoreString, data) + generateString(stringConfig.gameOverEndString, data);
  }

  return Promise.resolve({gameOver: string});
}

function toObject(arr) {
  const obj = {};

  arr.forEach(function(currectObj) {
    for (var key in currectObj) {
      if (currectObj.hasOwnProperty(key)) {
        obj[key] = currectObj[key];
      }
    }
  });

  return obj;
}

function generateString(string, data) {
  for (var key in data) {
    if (data.hasOwnProperty(key)) {
      string = string.replace(`{${key}}`, data[key]);
    }
  }

  return string;
}

module.exports = {
  init,
  generateWelcomeString,
  generateInstructionString,
  generateDontWantToPlayString,
  generateGameOverString
}
