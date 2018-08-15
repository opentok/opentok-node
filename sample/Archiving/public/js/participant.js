/* global OT, apiKey, sessionId, token */

var session = OT.initSession(apiKey, sessionId);
var publisher = OT.initPublisher('publisher');

session.connect(token, function (err) {
  if (err) {
    alert(err.message || err); // eslint-disable-line no-alert
  }
  session.publish(publisher);
});

session.on('streamCreated', function (event) {
  session.subscribe(event.stream, 'subscribers', { insertMode: 'append' });
});
