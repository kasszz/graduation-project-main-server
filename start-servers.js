const agenda = require('./lib/agenda.js');
const stringBuilder = require('./lib/string-builder.js');
const appointmentControllerLib = require('./lib/appointment-controller.js');
const express = require('./servers/express/bin/www');
const websockets = require('./servers/websockets/web-server.js');
const mqtt = require('./servers/mqtt/mqtt-server.js');

agenda.init()
  .then(stringBuilder.init)
  .then(startServices)


function startServices() {
  const httpServer = express.init(8000);
  const webSocketServer = websockets.init(httpServer, stringBuilder);
  const mqttServer = mqtt.init(8001);
  const appointmentController = appointmentControllerLib.init(websockets, mqtt, agenda, stringBuilder);
}
