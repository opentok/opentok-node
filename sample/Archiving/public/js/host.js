var session = OT.initSession(apiKey, sessionId),
    publisher = OT.initPublisher('publisher', {
      insertMode: 'append',
      width: '100%',
      height: '100%',
    }),
    archiveID = null;
var streams = [];
var currentLayoutClass = 'horizontalPresentation';

function toggleLayoutClass() {
  if (currentLayoutClass === 'horizontalPresentation') {
    currentLayoutClass = 'verticalPresentation';
    $('#streams').addClass('vertical');
    $('.focus').appendTo('#streams');
  } else {
    currentLayoutClass = 'horizontalPresentation';
    $('#streams').removeClass('vertical');
    $('.focus').prependTo('#streams');
  }
  session.signal({
    type: 'layoutClass',
    data: currentLayoutClass
  })
  return currentLayoutClass;
}

function createFocusClick(elementId, focusStreamId) {
  var $focusElement;
  $("#" + elementId).click(function() {
    otherStreams = streams.filter(function (streamId) {
      if (streamId !== focusStreamId) {
        $('#' + streamId).removeClass('focus');
        return true;
      }
      return false;
    });
    $.post('/focus', {
      focus: focusStreamId,
      otherStreams: otherStreams
    }).done(function () {
      console.log('Focus changed.');
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
      console.error('Stream class list error:', errorThrown); // -
    });

    $('.focus').removeClass('focus');
    $focusElement = (publisher.stream.id === focusStreamId) ? $('#publisher')
      : $('#' + focusStreamId)
    $focusElement.addClass('focus');
    if (currentLayoutClass === 'horizontalPresentation') {
      $focusElement.prependTo('#streams');
    } else {
      $focusElement.appendTo('#streams');
    }

    session.signal({
      type: 'focusStream',
      data: focusStreamId,
    })
  });
}

session.connect(token, function(err) {
  if(err) {
    alert(err.message || err);
  }
  session.publish(publisher);
});

publisher.on('streamCreated', function() {
  streams.push(publisher.stream.id);
  createFocusClick(publisher.id, publisher.stream.id);
});

session.on('streamCreated', function(event) {
  var streamContainer = document.createElement('div');
  streamContainer.id = event.stream.id;
  streams.push(event.stream.id);
  document.getElementById('streams').appendChild(streamContainer);
  var subscriber = session.subscribe(event.stream, streamContainer, {
    insertMode: 'append',
    width: '100%',
    height: '100%',
  });
  createFocusClick(subscriber.id, event.stream.id);
});

session.on('streamDestroyed', function(event) {
  var streamId = event.stream.id;
  var i;
  for (i = 0; i < streams.length; i += 1) {
    if (streams[i] === streamId) {
      streams.splice(1, i);
      break;
    }
  }
  $('#' + streamId).remove();
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
      .done(function () {
        $('.toggle-layout').show();
      })
      .fail(enableForm);
  }).show();
  $('.stop').click(function(event){
    $.get('stop/' + archiveID);
    $('.toggle-layout').hide();
  }).hide();
  $('.toggle-layout').click(function () {
    currentLayoutClass = toggleLayoutClass();
    $.post('archive/' + archiveID + '/layout', {
      type: currentLayoutClass
    }).done(function () {
      console.log('Archive layout updated.');
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
      console.error('Archive layout error:', errorThrown); // -
    });
  }).hide();
});


function disableForm() {
  $('.archive-options-fields').attr('disabled', 'disabled');
}

function enableForm() {
  $('.archive-options-fields').removeAttr('disabled');
}
