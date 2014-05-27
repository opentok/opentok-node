var session = OT.initSession(sessionId),
    publisher = OT.initPublisher("publisher");

session.connect(apiKey, token, function(err, info) {
  if(err) {
    alert(err.message || err);
  }
  session.publish(publisher);
});

session.on('streamCreated', function(event) {
  session.subscribe(event.stream, "subscribers", { insertMode : "append" });
});
