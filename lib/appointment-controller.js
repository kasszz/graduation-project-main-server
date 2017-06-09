const Slack = require('slack-node');
const db = require('./mysql.js');
const slack = new Slack();
slack.setWebhook('https://hooks.slack.com/services/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');

const interval = 100;
let webSocketServer;
let mqttServer;
let agenda;
let stringBuilder;

let appointment;
let timer;
let elevatorOpen = false;
let gameOver = false;
let strings = {};

function init(_webSocketServer, _mqttServer, _agenda, _stringBuilder) {
  webSocketServer = _webSocketServer;
  mqttServer = _mqttServer;
  agenda = _agenda;
  stringBuilder = _stringBuilder;
  startTimer();
}

function startTimer() {
  timer = setInterval(() => {
    if(!appointment) {
      polAgenda();
    }

    if(!elevatorOpen) {
      polElevatorStatus();
    }

    if(!gameOver) {
      polGameOverStatus();
    }

    polButtonStatus();
  }, interval);
}

function polAgenda() {
  isComingAppointment = agenda.getComingAppointment();

  if(isComingAppointment) {
    appointment = isComingAppointment;
    getStrings();
  }
}

function polElevatorStatus() {
  elevatorStatus = mqttServer.getElevatorStatus();

  if(elevatorStatus.left || elevatorStatus.right) {
    webSocketServer.sendStart();
    elevatorOpen = true;
    slack.webhook({
      channel: "#graduation_experience",
      username: "Experience-bot",
      icon_emoji: ":computer:",
      text: `${appointment.visitors} is zojuist boven gekomen`
    }, () => {});
  }
}

function polButtonStatus() {
  buttonStatus = mqttServer.getButtonStatus();

  if(buttonStatus.one) {
    webSocketServer.sendButtonPressed(1);
  } else if(buttonStatus.two) {
    webSocketServer.sendButtonPressed(2);
  } else if(buttonStatus.three) {
    webSocketServer.sendButtonPressed(3);
  }
}

function polGameOverStatus() {
  score = webSocketServer.getScore();

  if(score === -1) {
    gameOver = true;
    resetComponents();
    slack.webhook({
      channel: "#graduation_experience",
      username: "Experience-bot",
      icon_emoji: ":computer:",
      text: `${appointment.visitors} is klaar om opgehaald te worden`
    }, () => {});
  } else if(score) {
    gameOver = true;
    setHighscore(appointment.visitors, appointment.companyName, score)
      .then(row => {
        return getHighscore(row)
      })
      .then(data => {
        return stringBuilder.generateGameOverString(appointment.visitors, appointment.controleur, score, data.rank, data.highscores[0]);
      })
      .then(strings => {
        slack.webhook({
          channel: "#graduation_experience",
          username: "Experience-bot",
          icon_emoji: ":computer:",
          text: `${appointment.visitors} is klaar om opgehaald te worden`
        }, () => {});
        webSocketServer.sendGameOver(strings);
        resetComponents();
      })
      .catch(err => {
        throw err;
      })
  }
}

function getStrings() {
  const promisses = [
    stringBuilder.generateWelcomeString(appointment.visitors, appointment.controleur),
    stringBuilder.generateInstructionString(appointment.visitors, appointment.controleur),
    stringBuilder.generateDontWantToPlayString(appointment.visitors, appointment.controleur),
  ];

  Promise.all(promisses)
    .then(strings => {
      strings = toObject(strings);
      webSocketServer.sendStrings(strings);
    });
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

function getHighscore(row) {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM highscore ORDER BY score DESC', function (error, results, fields) {
      if (error) reject(error);
      let rank;
      let highscoreWithoutSelf = results.map((highscore, i) => {
        if(highscore.id !== row.insertId) {
          return highscore;
        } else {
          rank = i + 1;
          return false;
        }
      }).filter(item => item !== false);

      resolve({highscores: highscoreWithoutSelf, rank});
    });
  });
}

function setHighscore(name, company, score) {
  return new Promise((resolve, reject) => {
    const post = {
      name,
      company,
      score
    };

    db.query('INSERT INTO highscore SET ?', post, function (error, results, fields) {
      if (error) reject(error);

      resolve(results);
    });
  });
}

function resetComponents() {
  agenda.setAppointmentOnDone(appointment.googleId);
  webSocketServer.reset();
  mqttServer.reset();
  resetController();
}

function resetController() {
  appointment = null;
  elevatorOpen = null;
  gameOver = null;
}

module.exports = {
  init
}
