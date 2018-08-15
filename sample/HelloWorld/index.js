/* eslint-disable no-console, no-path-concat */

// Dependencies
var express = require('express');
var OpenTok = require('../../lib/opentok');
var app = express();

var opentok;
var apiKey = process.env.API_KEY;
var apiSecret = process.env.API_SECRET;

// Verify that the API Key and API Secret are defined
if (!apiKey || !apiSecret) {
  console.log('You must specify API_KEY and API_SECRET environment variables');
  process.exit(1);
}

// Starts the express app
function init() {
  app.listen(3000, function () {
    console.log('You\'re app is now ready at http://localhost:3000/');
  });
}

// Initialize the express app
app.use(express.static(__dirname + '/public')); //

// Initialize OpenTok
opentok = new OpenTok(apiKey, apiSecret);

// Create a session and store it in the express app
opentok.createSession(function (err, session) {
  if (err) throw err;
  app.set('sessionId', session.sessionId);
  // We will wait on starting the app until this is done
  init();
});

app.get('/', function (req, res) {
  var sessionId = app.get('sessionId');
  // generate a fresh token for this client
  var token = opentok.generateToken(sessionId);

  res.render('index.ejs', {
    apiKey: apiKey,
    sessionId: sessionId,
    token: token
  });
});
