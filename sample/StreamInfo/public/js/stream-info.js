var session = OT.initSession(apiKey, sessionId);
var publisher = OT.initPublisher('publisher', { name: 'Test stream' });

session.on({
  sessionConnected: function(event) {
    session.publish(publisher);
    publisher.on('streamCreated', function() {
      // Call the endpoint on the sample app server to notify it that the stream was created
      var xhr = new XMLHttpRequest();
      xhr.open('GET', '/session/' + sessionId + '/stream/' + publisher.stream.streamId);
      xhr.send();
    });
  },

  streamCreated: function(event) {
    session.subscribe(event.stream, 'subscribers', { insertMode: 'append' });
  }
});

session.connect(token);
