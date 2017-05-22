const stringConfig = require('../../config/string-builder.json').greeting;

function get() {
  return new Promise((resolve, reject) => {
    const time = new Date();

    stringConfig.forEach(stringTime => {
      if(between(time.getHours(), stringTime.range.min, stringTime.range.max)) {
        resolve({greeting: stringTime.string});
      }
    });
  });
}

function between(x, min, max) {
  return x >= min && x <= max;
}

module.exports = {
  get
}
