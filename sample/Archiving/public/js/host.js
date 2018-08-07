var session = OT.initSession(apiKey, sessionId),
    publisher = OT.initPublisher('publisher', {
      insertMode: 'append',
      width: '100%',
      height: '100%',
    }),
    archiveID = null;

function setFocus(focusStreamId) {
  var otherStreams = [];
  $('#streams').children().each(function (i, element) {
    if (element.id !== focusStreamId) {
      otherStreams.push(element.id);
      $('#' + element.id).removeClass('focus');
    }
  });

  $.post('/focus', {
    focus: focusStreamId,
    otherStreams: otherStreams
  }).done(function () {
    console.log('Focus changed.');
  })
  .fail(function (jqXHR, textStatus, errorThrown) {
    console.error('Stream class list error:', errorThrown);
  });

  $('.focus').removeClass('focus');
  $focusElement = (publisher.stream && publisher.stream.streamId === focusStreamId) ?
    $('#publisher') : $('#' + focusStreamId);
  $focusElement.addClass('focus');
  session.signal({
    type: 'focusStream',
    data: focusStreamId,
  });
  positionStreams();
}

function createFocusClick(elementId, focusStreamId) {
  var $focusElement;
  $("#" + elementId).click(function() {
    setFocus(focusStreamId);
  });
}

function positionStreams() {
  $focusElement = $('.focus');
  if ($('#streams').hasClass('vertical')) {
    $('#streams').children().css('top', '0')
    $focusElement.appendTo('#streams');
    $focusElement.css('top', (-20 * ($('#streams').children().size() - 1)) + '%');
  } else {
    $focusElement.prependTo('#streams');
    $focusElement.css('top', '0');
  }
}

if (layout === 'verticalPresentation') {
  $('#streams').addClass('vertical');
}

session.connect(token, function(err) {
  if(err) {
    alert(err.message || err);
  }
  session.publish(publisher);
});

publisher.on('streamCreated', function() {
  createFocusClick(publisher.id, publisher.stream.streamId);
  positionStreams();
});

session.on('streamCreated', function(event) {
  var streamId = event.stream.streamId;
  var $streamContainer = $('<div></div>');
  $streamContainer.attr('id', event.stream.id);
  $('#streams').append($streamContainer);
  var subscriber = session.subscribe(event.stream, streamId, {
    insertMode: 'append',
    width: '100%',
    height: '100%',
  });
  if (streamId === focusStreamId) {
    setFocus(streamId);
  }
  createFocusClick(subscriber.id, streamId);
  positionStreams();
});

session.on('streamDestroyed', function(event) {
  var $streamElem = $('#' + event.stream.id);
  if ($streamElem.hasClass('focus')) {
    setFocus(publisher.stream.streamId);
  }
  $streamElem.remove();
  positionStreams();
});

session.on('archiveStarted', function(event) {
  archiveID = event.id;
  console.log('ARCHIVE STARTED');
  $('.start').hide();
  $('.stop').show();
  disableForm();
});

session.on('archiveStopped', function(event) {
  archiveID = null;
  console.log('ARCHIVE STOPPED');
  $('.start').show();
  $('.stop').hide();
  enableForm();
});

$(document).ready(function() {
  $('.start').click(function (event) {
    var options = $('.archive-options').serialize();
    disableForm();
    $.post('/start', options)
      .fail(enableForm);
  }).prop('disabled', false );
  $('.stop').click(function(event){
    $.get('stop/' + archiveID);
  });
  $('.toggle-layout').click(function () {
    if ($('#streams').hasClass('vertical')) {
      $('#streams').removeClass('vertical');
    } else {
      $('#streams').addClass('vertical');
    }
    positionStreams();
    var currentLayoutClass = $('#streams').hasClass('vertical') ? 'verticalPresentation'
      : 'horizontalPresentation';
    $.post('archive/' + archiveID + '/layout', {
      type: currentLayoutClass
    }).done(function () {
      console.log('Archive layout updated.');
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
      console.error('Archive layout error:', errorThrown); // -
    });
    session.signal({
      type: 'layoutClass',
      data: currentLayoutClass
    })
  });
});

function disableForm() {
  $('.archive-options-fields').attr('disabled', 'disabled');
}

function enableForm() {
  $('.archive-options-fields').removeAttr('disabled');
}
