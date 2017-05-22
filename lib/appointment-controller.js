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
  } else if(score) {
    gameOver = true;
    stringBuilder.generateGameOverString(appointment.visitors, appointment.controleur, score)
      .then(strings => {
        webSocketServer.sendGameOver(strings);
        resetComponents();
      });
  }
}

function getStrings() {
  const promisses = [
    stringBuilder.generateWelcomeString(appointment.visitors, appointment.controleur),
    stringBuilder.generateGoodluckString(appointment.visitors, appointment.controleur),
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
