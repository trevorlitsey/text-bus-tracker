require('dotenv').config();

const http = require('http');
const bodyParser = require('body-parser');
const express = require('express');
const MessagingResponse = require('twilio').twiml.MessagingResponse;
const axios = require('axios');

const app = express();

const BASE_URL = 'https://svc.metrotransit.org/NexTrip';

const EIGHTEEN_NORTH = BASE_URL + '/18/4/46NI';
const EIGHTEEN_SOUTH = BASE_URL + '/18/1/7SNI';
const ONE_THIRTY_FIVE_NORTH = BASE_URL + '/135/4/48GR';
const ONE_THIRTY_FIVE_SOUTH = BASE_URL + '/135/1/MA8S';
const ONE_FORTY_SIX_NORTH = BASE_URL + '/146/4/46GR';
const ONE_FORTY_SIX_SOUTH = BASE_URL + '/146/1/MA8S';
const FIVE_THIRTY_FIVE_NORTH = BASE_URL + '/535/4/I346';
const FIVE_THIRTY_FIVE_SOUTH = BASE_URL + '/535/1/MA8S';
const FIVE_NINETY_SEVEN_NORTH = BASE_URL + '/597/4/I346';
const FIVE_NINETY_SEVEN_SOUTH = BASE_URL + '/597/1/MA8S';
const FIVE_SEVENTY_EIGHT_NORTH = BASE_URL + '/578/4/I346';
const FIVE_SEVENTY_EIGHT_SOUTH = BASE_URL + '/578/1/MA8S';

const formatDepartureTimes = data =>
  data.length ? data.map(d => d.DepartureText).join(', ') : 'None';

const fetchAndFormatDepartureTimes = url =>
  axios(url).then(res => formatDepartureTimes(res.data));

const getNorthBoundRoutes = async () => {
  const [
    oneFortySixDepartureTimes,
    fiveThirtyFiveDepartureTimes,
    fiveSeventyEightDepartureTimes,
    fiveNinetySevenDepartureTimes,
    oneThirtyFiveDepartureTimes,
    eighteenDepartureTimes,
  ] = await Promise.all([
    fetchAndFormatDepartureTimes(ONE_FORTY_SIX_NORTH),
    fetchAndFormatDepartureTimes(FIVE_THIRTY_FIVE_NORTH),
    fetchAndFormatDepartureTimes(FIVE_SEVENTY_EIGHT_NORTH),
    fetchAndFormatDepartureTimes(FIVE_NINETY_SEVEN_NORTH),
    fetchAndFormatDepartureTimes(ONE_THIRTY_FIVE_NORTH),
    fetchAndFormatDepartureTimes(EIGHTEEN_NORTH),
  ]);

  const message = [
    'NORTHBOUND ROUTES',
    '',
    '146 @ 46th St & Grand Ave (28m)',
    oneFortySixDepartureTimes,
    '',
    '535 @ I-35W & 46th St Station (28m)',
    fiveThirtyFiveDepartureTimes,
    '',
    '578 @ I-35W & 46th St Station (28m)',
    fiveSeventyEightDepartureTimes,
    '',
    '597 @ I-35W & 46th St Station (28m)',
    fiveNinetySevenDepartureTimes,
    '',
    '135 @ 48th St & Grand Ave (29m)',
    oneThirtyFiveDepartureTimes,
    '',
    '18 @ Nicollet & 46th St (35m)',
    eighteenDepartureTimes,
    '',
  ].join('\n');

  return message;
};

const getSouthboundRoutes = async () => {
  const [
    oneFortySixDepartureTimes,
    fiveThirtyFiveDepartureTimes,
    fiveSeventyEightDepartureTimes,
    fiveNinetySevenDepartureTimes,
    oneThirtyFiveDepartureTimes,
    eighteenDepartureTimes,
  ] = await Promise.all([
    fetchAndFormatDepartureTimes(ONE_FORTY_SIX_SOUTH),
    fetchAndFormatDepartureTimes(FIVE_THIRTY_FIVE_SOUTH),
    fetchAndFormatDepartureTimes(FIVE_SEVENTY_EIGHT_SOUTH),
    fetchAndFormatDepartureTimes(FIVE_NINETY_SEVEN_SOUTH),
    fetchAndFormatDepartureTimes(ONE_THIRTY_FIVE_SOUTH),
    fetchAndFormatDepartureTimes(EIGHTEEN_SOUTH),
  ]);

  const message = [
    'SOUTHBOUND ROUTES',
    '',
    '146 @ Marquette Ave & 8th St (26m)',
    oneFortySixDepartureTimes,
    '',
    '535 @ Marquette Ave & 8th St (31m)',
    oneThirtyFiveDepartureTimes,
    '',
    '578 @ Marquette Ave & 8th St (31m)',
    fiveSeventyEightDepartureTimes,
    '',
    '597 @ Marquette Ave & 8th St (31m)',
    fiveNinetySevenDepartureTimes,
    '',
    '135 @ Marquette Ave & 8th St (33m)',
    oneThirtyFiveDepartureTimes,
    '',
    '18 @ Nicollet Mall & 7th St (35m)',
    eighteenDepartureTimes,
    '',
  ].join('\n');

  return message;
};

app.get('/', (req, res) => {
  res.send('ok');
});

app.use('/sms', bodyParser.urlencoded({ extended: false }));

app.post('/sms', async (req, res) => {
  const twiml = new MessagingResponse();
  const userText = req.body.Body;
  const isSouthbound = ['s', 'h'].includes(userText);

  const getRoutes = isSouthbound ? getSouthboundRoutes : getNorthBoundRoutes;

  try {
    const message = await getRoutes();
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
