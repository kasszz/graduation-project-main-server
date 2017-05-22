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
  game.emit('messageStrings', strings);
}

function sendGameOver(strings) {
  game.emit('gameOver', strings);
}

function sendStart() {
  game.emit('start');
}

function sendButtonPressed(which) {
  game.emit('buttonPressed', which);
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
