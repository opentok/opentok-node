// Dependencies
var express = require('express'),
    bodyParser = require('body-parser'),
    request = require('request'),
    OpenTok = require('../../lib/opentok');

// Verify that the API Key and API Secret are defined
var apiKey = process.env.API_KEY,
    apiSecret = process.env.API_SECRET,
    baseUrl = process.env.PUBLIC_URL;
if (!apiKey || !apiSecret || !baseUrl) {
  console.log('You must specify API_KEY and API_SECRET and PUBLIC_URL environment variables');
  process.exit(1);
}

// Initialize the express app
var app = express();
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json({}));

// Initialize OpenTok
var opentok = new OpenTok(apiKey, apiSecret);

// Create a session and store it in the express app
opentok.createSession({ mediaMode: 'routed' },function(err, session) {
  if (err) throw err;
  app.set('sessionId', session.sessionId);
  // We will wait on starting the app until this is done
  init();
});

app.get('/', function(req, res) {
  var sessionId = app.get('sessionId'),
    // generate a fresh token for this client
    token = opentok.generateToken(sessionId);

  res.render('index.ejs', {
    apiKey: apiKey,
    sessionId: sessionId,
    token: token
  });
});

var EVENTS = []

app.post('/callback', function(req, res) {
  EVENTS.push(req.body);
  res.send('OK', 201);
});

app.get('/events', function(req, res) {
  res.render('events.ejs', {
    events: EVENTS,
  });
});

app.post('/signal', function(req, res) {
  var sessionId = req.param('sessionId');
  var connectionId = req.param('connectionId');
  var payload = { type: 'chat', data: 'Hello!' };
  opentok.signal(sessionId, connectionId, payload, function(err) {
    if (err) return res.send(500,
      'Could not send signal for session '+sessionId+'. error='+err.message
    );
    res.send('OK', 201);
  });
});

app.post('/disconnect', function(req, res) {
  var sessionId = req.param('sessionId');
  var connectionId = req.param('connectionId');
  opentok.forceDisconnect(sessionId, connectionId, function(err) {
    if (err) return res.send(500,
      'Could not send signal for session '+sessionId+'. error='+err.message
    );
    res.send('OK', 201);
  });
});

// Register callbacks and Start the express app
function init() {
  var callbackUrl = baseUrl + '/callback';
  opentok.registerCallback({ group: 'connection', event: 'created', url: callbackUrl }, function() { });
  opentok.registerCallback({ group: 'connection', event: 'destroyed', url: callbackUrl }, function() { });
  opentok.registerCallback({ group: 'stream', event: 'created', url: callbackUrl }, function() { });
  opentok.registerCallback({ group: 'stream', event: 'destroyed', url: callbackUrl }, function() { });

  app.listen(3000, function() {
    console.log('You\'re app is now ready at http://localhost:3000/');
  });
}
