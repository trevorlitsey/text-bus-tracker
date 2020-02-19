require('dotenv').config();

const http = require('http');
const express = require('express');
const twilio = require('twilio')(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
const axios = require('axios');

const app = express();

const BASE_URL = 'https://svc.metrotransit.org/NexTrip';

const EIGHTEEN = BASE_URL + '/18/4/46NI';
const ONE_THIRTY_FIVE = BASE_URL + '/135/4/48GR';
const ONE_FORTY_SIX = BASE_URL + '/146/4/46GR';
const FIVE_NINETY_SEVEN = BASE_URL + '/597/4/I346';

const formatDepartureTimes = data =>
  data.length ? data.map(d => d.DepartureText).join(', ') : 'None';

const fetchAndFormatDepartureTimes = url =>
  axios(url).then(res => formatDepartureTimes(res.data));

app.get('/', (req, res) => {
  res.send('ok');
});

app.post('/sms', async (req, res) => {
  var twiml = new twilio.TwimlResponse();

  try {
    const eighteenDepartureTimes = await fetchAndFormatDepartureTimes(EIGHTEEN);
    const oneThirtyFiveDepartureTimes = await fetchAndFormatDepartureTimes(
      ONE_THIRTY_FIVE
    );
    const oneFortySixDepartureTimes = await fetchAndFormatDepartureTimes(
      ONE_FORTY_SIX
    );
    const fiveNinetySevenDepartureTimes = await fetchAndFormatDepartureTimes(
      FIVE_NINETY_SEVEN
    );

    const message = [
      '18 @ Nicollet & 46th St',
      eighteenDepartureTimes,
      '',
      '135 @ 48th St & Grand Ave',
      oneThirtyFiveDepartureTimes,
      '',
      '146 @ 46th St & Grand Ave',
      oneFortySixDepartureTimes,
      '',
      '597 @ I-35W & 46th St Station',
      fiveNinetySevenDepartureTimes,
    ].join('\n');

    twiml.message(message);
    res.writeHead(200, { 'Content-Type': 'text/xml' });
  } catch (err) {
    twiml.message(JSON.stringify(err));
    res.writeHead(400, { 'Content-Type': 'text/xml' });
  }

  res.end(twiml.toString());
});

const PORT = process.env.PORT || 3000;
http.createServer(app).listen(PORT, function() {
  console.log('Express server listening on port ' + PORT);
});
