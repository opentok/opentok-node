window.onload = function(){
  var session = TB.initSession(sessionId); // OpenTok session ID.

  session.on({
    sessionConnected: function (event) {
     subscribeToStreams(event.streams);
    },
    streamCreated: function (event) {
      session.subscribe(event.stream);
    }
  });
  session.connect(apikey, token, function (error) {
    if (!error) {
      session.publish();
    }
  });
}
