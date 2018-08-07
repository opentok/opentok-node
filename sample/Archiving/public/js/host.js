var session = OT.initSession(apiKey, sessionId),
    publisher = OT.initPublisher('publisher', {
      insertMode: 'append',
      width: '100%',
      height: '100%',
    }),
    archiveID = null;

function createFocusClick(elementId, focusStreamId) {
  var $focusElement;
  $("#" + elementId).click(function() {
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
    $focusElement = (publisher.stream.id === focusStreamId) ? $('#publisher')
      : $('#' + focusStreamId)
    $focusElement.addClass('focus');
    session.signal({
      type: 'focusStream',
      data: focusStreamId,
    });
    positionStreams();
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

session.connect(token, function(err) {
  if(err) {
    alert(err.message || err);
  }
  session.publish(publisher);
});

publisher.on('streamCreated', function() {
  createFocusClick(publisher.id, publisher.stream.id);
  positionStreams();
});

session.on('streamCreated', function(event) {
  var $streamContainer = $('<div></div>');
  $streamContainer.attr('id', event.stream.id);
  $('#streams').append($streamContainer);
  var subscriber = session.subscribe(event.stream, event.stream.id, {
    insertMode: 'append',
    width: '100%',
    height: '100%',
  });
  createFocusClick(subscriber.id, event.stream.id);
  positionStreams();
});

session.on('streamDestroyed', function(event) {
  $('#' + event.stream.id).remove();
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
