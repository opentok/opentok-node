var session = OT.initSession(apiKey, sessionId);
var publisher;
var container = $('<div id = "publisher"></div>');

if (layout === 'verticalPresentation') {
  $('#streams').addClass('vertical');
}

container.addClass('focus');
$('#streams').append(container);

publisher = OT.initPublisher('publisher', {
  insertMode : 'append',
  width: '100%',
  height: '100%',
});

function focusStream(streamId) {
  focusStreamId = streamId;
  $focusElement = (publisher.stream && publisher.stream.id === focusStreamId) ? $('#publisher')
    : $('#' + focusStreamId);
  $('.focus').removeClass('focus');
  $focusElement.addClass('focus');
  if ($('#streams').hasClass('vertical')) {
    $focusElement.appendTo('#streams');
  } else {
    $focusElement.prependTo('#streams');
  }

}
session.connect(token, function(err) {
  if(err) {
    alert(err.message || err);
  }
  session.publish(publisher);
});

session.on('streamCreated', function(event) {
  var streamId = event.stream.id;
  var container = document.createElement('div');
  container.id = streamId;
  $('#streams').append(container);
  session.subscribe(event.stream, streamId, {
    insertMode : 'append',
    width: '100%',
    height: '100%',
  });
  if (streamId === focusStreamId) {
    focusStream(streamId);
  }
});

session.on('streamDestroyed', function(event) {
  $('#' + event.stream.id).remove();
});

session.on('signal:layoutClass', function(event) {
  if (event.data === 'horizontalPresentation') {
    $('#streams').removeClass('vertical');
    $('.focus').prependTo('#streams');
  } else {
    $('#streams').addClass('vertical');
    $('.focus').appendTo('#streams');
  }
});

session.on('signal:focusStream', function(event) {
  focusStream(event.data);
});
