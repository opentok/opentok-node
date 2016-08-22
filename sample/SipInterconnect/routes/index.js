var express = require('express');
var router = express.Router();
var request = require('request');
var config = require('../config');
var OpenTok = require('../../../lib/opentok');

var opentok = new OpenTok(config.apiKey, config.apiSecret);
var sessionId;
var webrtcToken;
var sipToken;

opentok.createSession({ mediaMode:"routed" }, function(error, session) {
  if (error) {
    console.log("Error creating session:", error);
    res.status(500).send("Error creating session ID.");
  } else {
    sessionId = session.sessionId;

    // For web tokens, moderator role is used to force disconnect SIP calls.
    // For SIP tokens, an identifying SIP flag is embedded in the metadata.
    webrtcToken = opentok.generateToken(sessionId, {role: "moderator"});
    sipToken = opentok.generateToken(sessionId, {data: "sip=true"});
  }
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {
    sessionId: sessionId,
    token: webrtcToken,
    apiKey: config.apiKey
  });
});

/* POST to start Wormhole SIP call. */
router.post('/sip/start', function(req, res, next) {
  console.log('received sip start call');
  var sessionId = req.body.sessionId;
  var apiKey = req.body.apiKey;
  opentok.dial(sessionId, sipToken, config.sipUri, {
    auth: {
      username: config.sipUsername,
      password: config.sipPassword
    }
  }, function (err, sipCall) {
    res.send(sipCall);
  });
});

module.exports = router;
