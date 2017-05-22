const agenda = require('../../../lib/agenda.js');
const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
  const date = new Date();

  res.render('index.html');
});

router.get('/appointments', (req, res, next) => {
  res.setHeader('Cache-Control', 'max-age=0');
  res.send(agenda.getAppointments());
});

router.post('/setactive', (req, res, next) => {
  const id = req.body.id;

  agenda.setAppointmentOnActive(id);
  res.send();
});

module.exports = router;
