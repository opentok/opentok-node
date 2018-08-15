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
  // We will wait on starting the app until this is done
  init();
});

app.get('/', function (req, res) {
  res.render('index.ejs');
});

app.get('/host', function (req, res) {
  var sessionId = app.get('sessionId');
  // generate a fresh token for this client
  var token = opentok.generateToken(sessionId, { role: 'moderator' });

  res.render('host.ejs', {
    apiKey: apiKey,
    sessionId: sessionId,
    token: token
  });
});

app.get('/participant', function (req, res) {
  var sessionId = app.get('sessionId');
  // generate a fresh token for this client
  var token = opentok.generateToken(sessionId, { role: 'moderator' });

  res.render('participant.ejs', {
    apiKey: apiKey,
    sessionId: sessionId,
    token: token
  });
});

app.get('/history', function (req, res) {
  var page = req.param('page') || 1;
  var offset = (page - 1) * 5;
  opentok.listArchives({ offset: offset, count: 5 }, function (err, archives, count) {
    if (err) return res.send(500, 'Could not list archives. error=' + err.message);
    return res.render('history.ejs', {
      archives: archives,
      showPrevious: page > 1 ? ('/history?page=' + (page - 1)) : null,
      showNext: (count > offset + 5) ? ('/history?page=' + (page + 1)) : null
    });
  });
});

app.get('/download/:archiveId', function (req, res) {
  var archiveId = req.param('archiveId');
  opentok.getArchive(archiveId, function (err, archive) {
    if (err) return res.send(500, 'Could not get archive ' + archiveId + '. error=' + err.message);
    return res.redirect(archive.url);
  });
});

app.post('/start', function (req, res) {
  var hasAudio = (req.param('hasAudio') !== undefined);
  var hasVideo = (req.param('hasVideo') !== undefined);
  var outputMode = req.param('outputMode');
  var sessionId = app.get('sessionId');
  opentok.startArchive(sessionId, {
    name: 'Node Archiving Sample App',
    hasAudio: hasAudio,
    hasVideo: hasVideo,
    outputMode: outputMode
  }, function (err, archive) {
    if (err) {
      return res.send(
        500,
        'Could not start archive for session ' + sessionId + '. error=' + err.message
      );
    }
    return res.json(archive);
  });
});

app.get('/stop/:archiveId', function (req, res) {
  var archiveId = req.param('archiveId');
  opentok.stopArchive(archiveId, function (err, archive) {
    if (err) return res.send(500, 'Could not stop archive ' + archiveId + '. error=' + err.message);
    return res.json(archive);
  });
});

app.get('/delete/:archiveId', function (req, res) {
  var archiveId = req.param('archiveId');
  opentok.deleteArchive(archiveId, function (err) {
    if (err) return res.send(500, 'Could not stop archive ' + archiveId + '. error=' + err.message);
    return res.redirect('/history');
  });
});
