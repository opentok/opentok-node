// Dependencies
var express = require('express'),
    OpenTok = require('../../lib/opentok')

// Verify that the API Key and API Secret are defined
var apiKey = process.env.API_KEY,
    apiSecret = process.env.API_SECRET;
rooms = {};
if (!apiKey || !apiSecret) {
  console.log('You must specify API_KEY and API_SECRET environment variables');
  process.exit(1);
}

// Initialize the express app
var app = express();
var server = require('http').Server(app);
app.use(express.static(__dirname + '/public'));

// Initialize OpenTok
var opentok = new OpenTok(apiKey, apiSecret);

app.get('/',function(req,res){
   res.render('welcome.ejs');
});

app.get('/:id', function (req, res) {
    var sessionId;
    if(rooms[req.params.id]){
        sessionId = rooms[req.params.id].sessionId;
        // generate a fresh token for this client
        var token = opentok.generateToken(sessionId);
        res.render('room.ejs', {
            apiKey: apiKey,
            sessionId: sessionId,
            token: token
        });
    }else{
        opentok.createSession(function(err, session) {
            if (err) throw err;
            sessionId = session.sessionId;
            rooms[req.params.id] = {sessionId:sessionId};
            console.log("index.js: sessionId = " + sessionId);
            // generate a fresh token for this client
            var token = opentok.generateToken(sessionId);

            res.render('room.ejs', {
                apiKey: apiKey,
                sessionId: sessionId,
                token: token
            });
        });
    }
});

// Start the express app
server.listen(80, function() {
    console.log('Your app is now ready at port 80');
});

require('./SocketServer')(server);