window.onload = function(){
  var session = TB.initSession(sessionId); // Sample session ID. 
			
	session.addEventListener("sessionConnected", sessionConnectedHandler);
	session.addEventListener("streamCreated", streamCreatedHandler);
	session.connect(apikey, token); // OpenTok sample API key and sample token string. 

  function sessionConnectedHandler(event) {
     subscribeToStreams(event.streams);
     session.publish();
  }

  function streamCreatedHandler(event) {
    subscribeToStreams(event.streams);
  }

  function subscribeToStreams(streams) {
    for (i = 0; i < streams.length; i++) {
      var stream = streams[i];
      if (stream.connection.connectionId != session.connection.connectionId) {
        session.subscribe(stream);
      }
    }
  }
}
