const agenda = require('./lib/agenda.js');
const express = require('./servers/express/bin/www');

agenda.init()
  .then(startServers)

function startServers() {
  const httpServer = express.init(8000);
}
