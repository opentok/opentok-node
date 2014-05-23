var session = OT.initSession(sessionId),
    publisher = OT.initPublisher("publisher"),
    archiveID = null;

session.connect(apiKey, token, function(err, info) {
  if(err) {
    alert(err.message || err);
  }
  session.publish(publisher);
});

session.on('streamCreated', function(event) {
  session.subscribe(event.stream, "subscribers", { insertMode: "append" });
});

session.on('archiveStarted', function(event) {
  archiveID = event.id;
  console.log("ARCHIVE STARTED");
  $(".start").hide();
  $(".stop").show();
});

session.on('archiveStopped', function(event) {
  archiveID = null;
  console.log("ARCHIVE STOPPED");
  $(".start").show();
  $(".stop").hide();
});

$(document).ready(function() {
  $(".start").click(function(event){
    $.get("start");
  }).show();
  $(".stop").click(function(event){
    $.get("stop/" + archiveID);
  }).hide();
});
