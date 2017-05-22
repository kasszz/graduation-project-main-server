const cronJob = require('cron').CronJob;

const googleCalendar = require('./google-calendar-api.js');

const keyWords = ['Bedrijfsnaam', 'Bezoekers', 'Contactpersoon', 'Reden'];
//1 day in milliseconds
const dateOffset = 86400000;
//every 10 minutes
const cronJobInterval = '*/1 * * * *';
let appointments = [];

function init() {
  return new Promise((resolve, reject) => {
    const date = formatDate(new Date());

    googleCalendar.getCalendar(date.start, date.end)
      .then(convertEvents)
      .then(sortAppointments)
      .then(() => {
        return Promise.resolve();
      })
      .then(initCronJob)
      .then(() => {
        console.log('Agenda: initialised');
        resolve();
      })
      .catch(err => {throw new Error(err)});
  });
}

function getAppointments() {
  return appointments;
}

function getComingAppointment() {
  let isComing;

  appointments.forEach(appointment => {
    if(!isComing && appointment.isComing) {
      isComing = appointment;
    }
  });

  return isComing;
}

function setAppointmentOnActive(googleId) {
  appointments.forEach(appointment => {
    if(appointment.googleId == googleId) {
      appointment.isComing = true;
    }
  });
}

function setAppointmentOnDone(googleId) {
  appointments.forEach(appointment => {
    if(appointment.googleId == googleId) {
      appointment.isComing = false;
      appointment.came = true;
    }
  });
}

function updateAppointments() {
  console.log('Agenda: checking for changes...');

  const date = formatDate(new Date());

  googleCalendar.getCalendar(date.start, date.end)
    .then(checkModifiedEvents)
    .then(checkRemovedEvents)
    .then(checkNewEvents)
    .then(newEvents => {
      if(newEvents.length === 0) {
        return Promise.reject('early');
      }

      console.log(`Agenda: ${newEvents.length} appointments added`);
      return convertEvents(newEvents);
    })
    .then(sortAppointments)
    .catch(err => {
      if(err !== 'early') {
        throw new Error(err);
      }
    });
}

function sortAppointments() {
  appointments.sort((a, b) => {
    return new Date(a.timeStart).getTime() - new Date(b.timeStart).getTime();
  });

  return Promise.resolve();
}

function convertEvents(events) {
  events.forEach(event => {
    appointments.push(createAppointment(event));
  });

  return Promise.resolve();
}

function checkModifiedEvents(events) {
  events.forEach(event => {
    appointments.forEach((appointment, i) => {
      if(event.id === appointment.googleId && event.updated !== appointment.lastModified) {
        console.log(`Agenda: appointment ${event.summary} updated`);
        appointments[i] = createAppointment(event);
      }
    });
  });

  return Promise.resolve(events);
}

function checkRemovedEvents(events) {
  appointments = appointments.filter((appointment) => {
    let exists = false;

    events.forEach(event => {
      if(event.id === appointment.googleId) {
        exists = true;
      }
    });

    return exists;
  });

  return Promise.resolve(events);
}

function checkNewEvents(events) {
  const newEventsArray = events.filter(event => {
    let isNew = true;

    appointments.forEach(appointment => {
      if(event.id === appointment.googleId) {
        isNew = false;
      }
    });

    return isNew;
  });

  return Promise.resolve(newEventsArray);
}

function initCronJob() {
  new cronJob({
    cronTime: cronJobInterval,
    onTick: updateAppointments,
    start: true
  });
}

function getInformation(event) {
  if(event.description === undefined) {
    console.log(`Agenda: no description in ${event.summary}`);
    return [];
  }

  return keyWords.map(keyWord => {
    let valueArray = (event.description.split(keyWord).length != 1) ? event.description.split(keyWord) : event.description.split(keyWord.toLowerCase());

    if(valueArray.length == 1) {
      return false;
    }

    return valueArray[1].split('\n')[0].replace(':', '').trim();
  });
}

function createAppointment(event) {
  const information = getInformation(event);

  return {
    googleId: event.id,
    lastModified: event.updated,
    title: event.summary,
    timeStart: event.start.dateTime,
    timeEnd: event.end.dateTime,
    companyName: information[0],
    visitors: information[1],
    controleur: information[2],
    reason: information[3],
    isComing: false,
    came: false
  };
}

function formatDate(date) {
  date.setHours(0);
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);

  const timeStamp = date.getTime();

  return {
    start: new Date(timeStamp).toISOString(),
    end: new Date(timeStamp + dateOffset).toISOString()
  }
}

module.exports = {
  init,
  getAppointments,
  getComingAppointment,
  setAppointmentOnActive,
  setAppointmentOnDone
}
