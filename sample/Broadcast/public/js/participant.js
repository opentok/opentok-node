/* global OT, apiKey, sessionId, token, $, layout, focusStreamId */
var session = OT.initSession(apiKey, sessionId);
var publisher;

var container = $('<div id = "publisher"></div>');

if (layout === 'verticalPresentation') {
  $('#streams').addClass('vertical');
}

container.addClass('focus');
$('#streams').append(container);

publisher = OT.initPublisher('publisher', {
  insertMode: 'append',
  width: '100%',
  height: '100%',
  resolution: '1280x720'
});

function positionStreams() {
  var $focusElement = $('.focus');
  if ($('#streams').hasClass('vertical')) {
    $focusElement.appendTo('#streams');
    $('#streams').children().css('top', '0');
    $focusElement.css('top', (-20 * ($('#streams').children().size() - 1)) + '%');
  }
  else {
    $focusElement.prependTo('#streams');
    $focusElement.css('top', '0');
  }
}

function focusStream(streamId) {
  var focusStreamId = streamId;
  var $focusElement = (publisher.stream && publisher.stream.id === focusStreamId) ? $('#publisher')
    : $('#' + focusStreamId);
  $('.focus').removeClass('focus');
  $focusElement.addClass('focus');
  positionStreams();
}

session.connect(token, function (err) {
  if (err) {
    alert(err.message || err); // eslint-disable-line no-alert
  }
  session.publish(publisher);
});

session.on('streamCreated', function (event) {
  var streamId = event.stream.id;
  container = document.createElement('div');
  container.id = streamId;
  $('#streams').append(container);
  session.subscribe(event.stream, streamId, {
    insertMode: 'append',
    width: '100%',
    height: '100%'
  });
  if (streamId === focusStreamId) {
    focusStream(streamId);
  }
  positionStreams();
});

session.on('streamDestroyed', function (event) {
  $('#' + event.stream.id).remove();
  positionStreams();
});

session.on('signal:layoutClass', function (event) {
  if (event.data === 'horizontalPresentation') {
    $('#streams').removeClass('vertical');
    $('.focus').prependTo('#streams');
  }
  else {
    $('#streams').addClass('vertical');
    $('.focus').appendTo('#streams');
  }
  positionStreams();
});

session.on('signal:focusStream', function (event) {
  focusStream(event.data);
});
