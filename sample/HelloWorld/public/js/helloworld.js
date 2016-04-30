// Initialize an OpenTok Session object.
var session = OT.initSession(sessionId);

// Initialize a Publisher, and place it into the 'publisher' DOM element.
var publisher = OT.initPublisher(apiKey, 'publisher');

session.on('streamCreated', function(event) {
  // Called when another client publishes a stream.
  // Subscribe to the stream that caused this event.
  session.subscribe(event.stream, 'subscribers', { insertMode: 'append' });
});

// Connect to the session using your OpenTok API key and the client's token for the session
session.connect(apiKey, token, function(error) {
  if (error) {
    console.error(error);
  } else {
    // Publish a stream, using the Publisher we initialzed earlier.
    // This triggers a streamCreated event on other clients.
    session.publish(publisher);
  }
});
