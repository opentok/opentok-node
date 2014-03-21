window.onload = function(){
  var session = TB.initSession(sessionId); // OpenTok session ID.
  session.on("streamCreated", function(event) {
      session.subscribe(event.stream);
    });
  session.connect(apikey, token, function(error) {
    if (error) {
      console.log(error);
    } else {
      session.publish();
    }
  });
}
