/* eslint-disable no-console */

var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var config = require('./config');
var OpenTok = require('../../lib/opentok');

var app = express();
var opentok = new OpenTok(config.apiKey, config.apiSecret);
var sessionId;
var webrtcToken;
var sipToken;
var port = process.env.PORT || 3000;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

if (!config.apiKey || !config.apiSecret) {
  throw new Error('API_KEY or API_SECRET must be defined as an environment variable');
}

opentok.createSession({ mediaMode: 'routed' }, function (error, session) {
  if (error) {
    throw new Error('Error creating session:' + error);
  }
  else {
    sessionId = session.sessionId;

    // For web tokens, moderator role is used to force disconnect SIP calls.
    // For SIP tokens, an identifying SIP flag is embedded in the metadata.
    webrtcToken = opentok.generateToken(sessionId, { role: 'moderator' });
    sipToken = opentok.generateToken(sessionId, { data: 'sip=true' });
  }
});

/* GET home page. */
app.get('/', function (req, res) {
  res.render('index', {
    sessionId: sessionId,
    token: webrtcToken,
    apiKey: config.apiKey
  });
});

/* POST to start SIP call. */
app.post('/sip/start', function (req, res) {
  opentok.dial(req.body.sessionId, sipToken, config.sipUri, {
    auth: {
      username: config.sipUsername,
      password: config.sipPassword
    },
    headers: config.sipHeaders
  }, function (err, sipCall) {
    if (err) {
      console.error(err);
      return res.status(500).send('Platform error starting SIP Call:' + err);
    }
    console.dir(sipCall);
    return res.send(sipCall);
  });
});

app.listen(port);
console.log('Sample app is listening on port ' + port);
