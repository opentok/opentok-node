var http = require('http')
  , url = require('url')
  , fs = require('fs')
  , server

  // opentok:
  , opentok = require('opentok')
  , OPENTOK_API_KEY = 'XXXX' // add your API key here
  , OPENTOK_API_SECRET = 'XXXX'; // and your secret here


// create a single instance of opentok sdk.
var ot = new opentok.OpenTokSDK(OPENTOK_API_KEY,OPENTOK_API_SECRET)

server = http.createServer(function(req, res){
  var path = url.parse(req.url).pathname;

  switch (path){
    case '/':
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.write(
        renderExampleHTML(
          OPENTOK_API_KEY,
          ot.sessionId,
          ot.generateToken({
            'connection_data': "userid_" + new Date().getTime(),
            'role': "publisher"
          })
        )
      );
      res.end();
      break;

    case '/opentok-client.js':
      fs.readFile(__dirname + path, function(err, data){
        if (err) return send404(res);
        res.writeHead(200, {'Content-Type': 'text/javascript'})
        res.write(data, 'utf8');
        res.end();
      });
      break;

    default: send404(res);
  }
}),

send404 = function(res){
  res.writeHead(404);
  res.write('404');
  res.end();
};

renderExampleHTML = function(apikey, sessionId, token){
  return [
    '<html>\n',
      '<head>\n',
        '<title>OpenTok Hello World</title>\n',
        '<script src="http://static.opentok.com/v0.91/js/TB.min.js"></script>\n',
        '<script>\n',
          'var apikey = "',apikey,'"\n',
          '  , sessionId = "',sessionId,'"\n',
          '  , token = "',token,'";\n',
        '</script>\n',
        '<script src="opentok-client.js"></script>\n',
      '</head>\n',
      '<body>\n',
      '</body>\n',
    '</html>\n'
  ].join("");
}


console.log("Connecting to TokBox to establish session");

// for our example, we're just creating a single global session, and will generate
// a unique token for each page request

ot.createSession('localhost',{},function(sessionId){
  server.listen(8000);
  console.log("Session Created, server running on port 8000");
})

