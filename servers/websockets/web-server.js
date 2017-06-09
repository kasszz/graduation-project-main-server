const io = require('socket.io');

let webSocket;
let game;
let stringBuilder;
let score;

function init(httpServer, _stringBuilder) {
  webSocket = io(httpServer);
  stringBuilder = _stringBuilder;

  webSocket.on('connection', function(client) {
    game = client;
    console.log('henk');
    game.on('gameOver', _score => {
      score = _score;
    });

    game.on('dontWantToPlay', () => {
      score = -1;
    });
  });

  return webSocket;
}

function sendStrings(strings) {
  if(game) {
    game.emit('messageStrings', strings);
  }
}

function sendGameOver(strings) {
  if(game) {
    game.emit('gameOver', strings);
  }
}

function sendStart() {
  console.log('I want to do this');
  if(game) {
    console.log('i do this');
    game.emit('start');
  }
}

function sendButtonPressed(which) {
  if(game) {
    game.emit('buttonPressed', which);
  }
}

function getScore() {
  return score;
}

function reset() {
  score = null;
}

module.exports = {
  init,
  sendStrings,
  sendStart,
  sendButtonPressed,
  sendGameOver,
  getScore,
  reset
}
