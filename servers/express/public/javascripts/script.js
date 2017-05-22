(() => {
  var statusDone = 'gearriveerd';
  var monthNames = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var appointments = [];
  var html = {
    date: document.querySelector('.date'),
    appointmentTable: document.querySelector('.appointment-table'),
    appointmentList: document.querySelector('.appointment-list'),
    noAppointments: document.querySelector('.no-appointments'),
    clock: document.querySelector('.current-time-cell'),
    callToAction: null
  };

  getData();
  setDate();
  setClock();
  checkCallToActionElement();

  window.setInterval(function() {
    getData();
  }, 10000);

  function setDate() {
    var date = new Date();
    html.date.innerHTML = date.getDate() + ' ' + monthNames[date.getMonth()];
  }

  function getData() {
    getAjax('http://localhost:8000/appointments', function(response) {
      var data = JSON.parse(response);

      appointments = data;
      renderHtml();
      checkCallToActionElement();
    });
  }

  function setClock() {
    html.clock.innerHTML = formatTime(new Date());

    window.setInterval(function() {
      html.clock.innerHTML = formatTime(new Date());
      checkCallToActionElement();
    }, 1000);
  }

  function checkCallToActionElement() {
    var hasChanged = false;

    appointments.forEach(function(appointment, i) {
      if(new Date(appointment.timeStart).getTime() > new Date().getTime() && !hasChanged) {
        var index = i;
        var newCallToAction = html.appointmentList.childNodes[index];

        if(html.callToAction) {
          html.callToAction.classList.remove('call-to-action');
        }

        while(newCallToAction && newCallToAction.classList.contains('visited')) {
          newCallToAction = html.appointmentList.childNodes[index++];
        }

        if(!newCallToAction) {
          return;
        }

        newCallToAction.classList.add('call-to-action');
        html.callToAction = newCallToAction;
        hasChanged = true;
      }
    });
  }

  function renderHtml() {
    if(appointments.length === 0) {
      html.noAppointments.classList.add('active');
      html.appointmentTable.classList.remove('active');
    } else {
      html.noAppointments.classList.remove('active');
      html.appointmentTable.classList.add('active');
    }

    html.appointmentList.innerHTML = '';
    appointments.forEach(function(appointment) {
          generateAppointmentHTML(appointment);
    });
  }

  function generateAppointmentHTML(appointment) {
    var tr = document.createElement('tr');

    var tdTime = document.createElement('td');
    tdTime.classList.add('time');
    tr.appendChild(tdTime);

    var timeStart = document.createElement('span');
    timeStart.appendChild(document.createTextNode(formatTime(new Date(appointment.timeStart))));
    tdTime.appendChild(timeStart);

    var timeEnd = document.createElement('span');
    timeEnd.appendChild(document.createTextNode(formatTime(new Date(appointment.timeEnd))));
    tdTime.appendChild(timeEnd);

    var tdDescription = document.createElement('td');
    tdDescription.classList.add('description');
    tr.appendChild(tdDescription);

    var companyName = document.createElement('span');
    companyName.classList.add('company-name');
    companyName.appendChild(document.createTextNode((appointment.companyName) ? appointment.companyName : 'Niet ingevuld'));
    tdDescription.appendChild(companyName);

    var visitors = document.createElement('span');
    visitors.appendChild(document.createTextNode((appointment.visitors) ? appointment.visitors : 'Niet ingevuld'));
    tdDescription.appendChild(visitors);

    var reason = document.createElement('td');
    reason.appendChild(document.createTextNode((appointment.reason) ? appointment.reason : 'Niet ingevuld'));
    tr.appendChild(reason);

    var tdStatus = document.createElement('td');
    tdStatus.classList.add('status');
    tr.appendChild(tdStatus);

    if(appointment.isComing || appointment.came) {
      tdStatus.innerHTML = statusDone;
      tdStatus.parentNode.classList.add('visited');
    } else {
      var button = document.createElement('button');
      button.setAttribute('data-google-id', appointment.googleId);
      button.appendChild(document.createTextNode('ja'));
      button.addEventListener('click', setActive);
      tdStatus.appendChild(button);
    }

    html.appointmentList.appendChild(tr);
  }

  function setActive(evt) {
    var id = evt.target.getAttribute('data-google-id');

    postAjax('http://localhost:8000/setactive', {id: id}, function() {
      evt.target.parentNode.parentNode.classList.add('visited');
      evt.target.parentNode.innerHTML = statusDone;
      setAppointmentOnActive(id);
    });
  }

  function formatTime(date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();

    if(hours < 10) hours = '0' + hours;
    if(minutes < 10) minutes = '0' + minutes;

    return hours + ':' + minutes;
  }

  function setAppointmentOnActive(googleId) {
    appointments.forEach(appointment => {
      if(appointment.googleId === googleId) {
        appointment.active = true;
      }
    });
  }

  function getAjax(url, success) {
    var xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');
    xhr.open('GET', url);

    xhr.onreadystatechange = function() {
        if (xhr.readyState > 3 && xhr.status == 200) success(xhr.responseText);
    };

    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    xhr.send();
  }

  function postAjax(url, data, success) {
    var params = typeof data == 'string' ? data : Object.keys(data).map(
      function(k){
        return encodeURIComponent(k) + '=' + encodeURIComponent(data[k])
      }).join('&');

    var xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
    xhr.open('POST', url);

    xhr.onreadystatechange = function() {
      if (xhr.readyState > 3 && xhr.status == 200) {
        success(xhr.responseText);
    }};

    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send(params);
  }

})();


