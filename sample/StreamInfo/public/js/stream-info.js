var session = OT.initSession(apiKey, sessionId);
var publisher = OT.initPublisher('publisher');

session.on({
  sessionConnected: function(event) {
    var publisher = session.publish(publisher);
    publisher.on('streamCreated', function() {
      // Call the endpoint on the sample app server to notify it that the stream was created
      var xhr = new XMLHttpRequest();
      xhr.open('GET', '/session/' + sessionId + '/stream/' + publisher.stream.streamId);
      xhr.send();
    });
  },

  streamCreated: function(event) {
    var subContainer = document.createElement('div');
    subContainer.id = 'stream-' + event.stream.streamId;
    document.getElementById('subscribers').appendChild(subContainer);
    session.subscribe(event.stream, subContainer);
  }
});

session.connect(token);
