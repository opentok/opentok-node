/* global OT, apiKey, sessionId, token */

// Initialize an OpenTok Session object
var session = OT.initSession(apiKey, sessionId);

// Initialize a Publisher, and place it into the element with id="publisher"
var publisher = OT.initPublisher('publisher');

// Attach event handlers
session.on({

  // This function runs when session.connect() asynchronously completes
  sessionConnected: function () {
    // Publish the publisher we initialzed earlier (this will trigger 'streamCreated' on other
    // clients)
    session.publish(publisher);
  },

  // This function runs when another client publishes a stream (eg. session.publish())
  streamCreated: function (event) {
    session.subscribe(event.stream, 'subscribers', { insertMode: 'append' });
  }

});

// Connect to the Session using the 'apiKey' of the application and a 'token' for permission
session.connect(token);
