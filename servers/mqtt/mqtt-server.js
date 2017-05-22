const mosca = require('mosca');
let server;

let elevatorOpen = {
  left: false,
  right: false
};

let buttonDown = {
  one: false,
  two: false,
  three: false
}

function init() {
  server = new mosca.Server({port: 8001});
  startEvents();
}

function getElevatorStatus() {
  return elevatorOpen;
}

function getButtonStatus() {
  return buttonDown;
}

function startEvents() {
  server.on('published', function(packet, client) {
    if(packet.topic === 'elevator_open') {
      if(packet.payload.toString() === "left") {
        console.log('MQTT: the left elevator is open!');
        elevatorOpen.left = true;
      }

      if(packet.payload.toString() === "right") {
        console.log('MQTT: the right elevator is open!');
        elevatorOpen.right = true;
      }
    }

    if(packet.topic === 'button_pressed') {
      switch(packet.payload.toString()) {
        case "1":
          buttonDown.one = true;
          buttonDown.two = false;
          buttonDown.three = false;
          break;
        case "2":
          buttonDown.one = false;
          buttonDown.two = true;
          buttonDown.three = false;
          break;
        case "3":
          buttonDown.one = false;
          buttonDown.two = false;
          buttonDown.three = true;
          break;
      }
    }
  });

  server.on('clientConnected', function(client) {
  console.log('MQTT: client connected ', client.id);
  });

  server.on('clientDisconnected', function(client) {
  console.log('MQTT: client disconnected ', client.id);
  });

  server.on('ready', () => {
    console.log('MQTT: initialised');
  });
}

function reset() {
  elevatorOpen.left = false;
  elevatorOpen.right = false;
  buttonDown.one = false;
  buttonDown.two = false;
  buttonDown.three = false;

  server.publish({
    topic: 'dormant',
    payload: '1',
    qos: 0,
    retain: false
  });
}

module.exports = {
  init,
  getElevatorStatus,
  getButtonStatus,
  reset
}
