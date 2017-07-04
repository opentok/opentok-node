var session = OT.initSession(apiKey, sessionId),
    publisher = OT.initPublisher("publisher");

session.connect(token, function(err) {
  if(err) {
    alert(err.message || err);
  }
  session.publish(publisher);
});

session.on('streamCreated', function(event) {
  session.subscribe(event.stream, "subscribers", { insertMode : "append" });
});
