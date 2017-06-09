const fs = require('fs');
const readline = require('readline');
const google = require('googleapis');
const googleAuth = require('google-auth-library');

const config = require(process.cwd() + '/config/google-config.json');

function getCalendar(_startDate, _endDate) {

  return readFile(process.cwd() + config.secretPath)
    .then(getOauth2Client)
    .then(oauth2Client => {
      return linkCredentials({
        start: _startDate,
        end: _endDate
      }, oauth2Client);
    })
    .catch(err => {
      throw new Error(err);
    });
}

function getOauth2Client(content) {
  const credentials = JSON.parse(content);

  const clientId = credentials.installed.client_id;
  const clientSecret = credentials.installed.client_secret;
  const redirectUrl = credentials.installed.redirect_uris[0];

  const auth = new googleAuth();
  const oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  return Promise.resolve(oauth2Client);
}

function linkCredentials(date, oauth2Client) {
  return readFile(process.cwd() + config.tokenPath)
    .then(token => {
      oauth2Client.credentials = JSON.parse(token);
      return getList(date, oauth2Client);
    })
    .catch(err => {
      return getNewToken(oauth2Client)
        .then(auth => {
          getList(date, oauth2Client);
        })
        .catch(err => {
          return Promise.reject(err);
        });
    });
}

function getNewToken(oauth2Client) {
  return new Promise((resolve, reject) => {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: config.scopes
    });

    console.log('Authorize this app by visiting this url: ', authUrl);

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('Enter the code from that page here: ', function(code) {
      rl.close();

      oauth2Client.getToken(code, function(err, token) {
        if (err) {
          return reject('Error while trying to retrieve access token', err);
        }
        oauth2Client.credentials = token;
        storeToken(token);
        resolve(oauth2Client);
      });
    });
  });
}

function storeToken(token) {
  try {
    fs.mkdirSync(process.cwd() + config.tokenDir);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(process.cwd() + config.tokenPath, JSON.stringify(token));
  console.log('Token stored to ' + process.cwd() + config.tokenPath);
}

function getList(date, auth) {
  if(Array.isArray(auth)) {
    return;
  }

  return new Promise((resolve, reject) => {
    const calendar = google.calendar('v3');

    calendar.events.list({
      auth: auth,
      calendarId: 'primary',
      timeMin: date.start,
      timeMax: date.end
    }, function(err, response) {
      if (err) {
        reject('The API returned an error: ' + err);
      }

      if(response) {
        resolve(response.items);
      }
    });
  });
}

function readFile(dir) {
  return new Promise((resolve, reject) => {
    fs.readFile(dir, (err, content) => {
      if (err) {
        reject('Error loading file: ' + err);
      }

      resolve(content);
    });
  });
}

module.exports = {
  getCalendar
}
