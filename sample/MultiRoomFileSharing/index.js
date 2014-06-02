// Dependencies
var express = require('express'),
    OpenTok = require('../../lib/opentok');

// Verify that the API Key and API Secret are defined
var apiKey = process.env.API_KEY,
    apiSecret = process.env.API_SECRET;
var roomsSession = {};
if (!apiKey || !apiSecret) {
  console.log('You must specify API_KEY and API_SECRET environment variables');
  process.exit(1);
}

// Initialize the express app
var app = express();
app.use(express.static(__dirname + '/public'));

// Initialize OpenTok
var opentok = new OpenTok(apiKey, apiSecret);

app.get('/',function(req,res){
   res.render('welcome.ejs');
});

app.get('/:id', function (req, res) {
    var sessionId;
    if(roomsSession[req.params.id]){
        sessionId = roomsSession[req.params.id];
        // generate a fresh token for this client
        var token = opentok.generateToken(sessionId);
        res.render('index.ejs', {
            apiKey: apiKey,
            sessionId: sessionId,
            token: token
        });
    }
    else
        opentok.createSession(function(err, session) {
            if (err) throw err;
            sessionId = session.sessionId;
            roomsSession[req.params.id] = sessionId;
            console.log("sessionId = " + sessionId);
            // generate a fresh token for this client
            var token = opentok.generateToken(sessionId);

            res.render('index.ejs', {
                apiKey: apiKey,
                sessionId: sessionId,
                token: token
            });
        });
});

// Start the express app
app.listen(3000, function() {
    console.log('Your app is now ready at http://localhost:3000/');
});
