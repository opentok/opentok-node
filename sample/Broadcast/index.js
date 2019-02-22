/* eslint-disable no-console, no-path-concat */

// Dependencies
var express = require('express');
var bodyParser = require('body-parser');
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

// Initialize the express app
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({
  extended: true
}));

// Starts the express app
function init() {
  app.listen(3000, function () {
    console.log('You\'re app is now ready at http://localhost:3000/');
  });
}

// Initialize OpenTok
opentok = new OpenTok(apiKey, apiSecret);

// Create a session and store it in the express app
opentok.createSession({ mediaMode: 'routed' }, function (err, session) {
  if (err) throw err;
  app.set('sessionId', session.sessionId);
  app.set('layout', 'horizontalPresentation');
  // We will wait on starting the app until this is done
  init();
});

app.get('/', function (req, res) {
  res.render('index.ejs');
});

app.get('/host', function (req, res) {
  var sessionId = app.get('sessionId');
  // generate a fresh token for this client
  var token = opentok.generateToken(sessionId, {
    role: 'publisher',
    initialLayoutClassList: ['focus']
  });

  res.render('host.ejs', {
    apiKey: apiKey,
    sessionId: sessionId,
    token: token,
    initialBroadcastId: app.get('broadcastId'),
    focusStreamId: app.get('focusStreamId') || '',
    initialLayout: app.get('layout')
  });
});

app.get('/participant', function (req, res) {
  var sessionId = app.get('sessionId');
  // generate a fresh token for this client
  var token = opentok.generateToken(sessionId, { role: 'publisher' });

  res.render('participant.ejs', {
    apiKey: apiKey,
    sessionId: sessionId,
    token: token,
    focusStreamId: app.get('focusStreamId') || '',
    layout: app.get('layout')
  });
});

app.get('/broadcast', function (req, res) {
  var broadcastId = app.get('broadcastId');
  if (!broadcastId) {
    return res.send(404, 'Broadcast not in progress.');
  }
  return opentok.getBroadcast(broadcastId, function (err, broadcast) {
    if (err) {
      return res.send(500, 'Could not get broadcast ' + broadcastId + '. error=' + err.message);
    }
    if (broadcast.status === 'started') {
      return res.redirect(broadcast.broadcastUrls.hls);
    }
    return res.send(404, 'Broadcast not in progress.');
  });
});

app.post('/start', function (req, res) {
  var broadcastOptions = {
    maxDuration: Number(req.param('maxDuration')) || undefined,
    resolution: req.param('resolution'),
    layout: req.param('layout'),
    outputs: {
      hls: {}
    }
  };
  opentok.startBroadcast(app.get('sessionId'), broadcastOptions, function (err, broadcast) {
    if (err) {
      return res.send(500, err.message);
    }
    app.set('broadcastId', broadcast.id);
    return res.json(broadcast);
  });
});

app.get('/stop/:broadcastId', function (req, res) {
  var broadcastId = req.param('broadcastId');
  opentok.stopBroadcast(broadcastId, function (err, broadcast) {
    if (err) {
      return res.send(500, 'Error = ' + err.message);
    }
    app.set('broadcastId', null);
    return res.json(broadcast);
  });
});

app.post('/broadcast/:broadcastId/layout', function (req, res) {
  var broadcastId = req.param('broadcastId');
  var type = req.body.type;
  app.set('layout', type);
  if (broadcastId) {
    opentok.setBroadcastLayout(broadcastId, type, null, function (err) {
      if (err) {
        return res.send(500, 'Could not set layout ' + type + '. Error: ' + err.message);
      }
      return res.send(200, 'OK');
    });
  }
});

app.post('/focus', function (req, res) {
  var otherStreams = req.body.otherStreams;
  var focusStreamId = req.body.focus;
  var classListArray = [];
  var i;

  if (otherStreams) {
    for (i = 0; i < otherStreams.length; i++) {
      classListArray.push({
        id: otherStreams[i],
        layoutClassList: []
      });
    }
  }
  classListArray.push({
    id: focusStreamId,
    layoutClassList: ['focus']
  });
  app.set('focusStreamId', focusStreamId);
  opentok.setStreamClassLists(app.get('sessionId'), classListArray, function (err) {
    if (err) {
      return res.send(500, 'Could not set class lists.' + err.message);
    }
    return res.send(200, 'OK');
  });
});
