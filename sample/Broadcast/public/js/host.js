/* global OT, apiKey, sessionId, initialBroadcastId, token, $, initialLayout, focusStreamId */
/* eslint-disable no-console */

var session = OT.initSession(apiKey, sessionId);
var publisher = OT.initPublisher('publisher', {
  insertMode: 'append',
  width: '100%',
  height: '100%',
  resolution: '1280x720'
});
var broadcastId = initialBroadcastId;
var layout = initialLayout;

function disableForm() {
  $('.broadcast-options-fields').attr('disabled', 'disabled');
  $('.start').hide();
  $('.stop').show();
}

function enableForm() {
  $('.broadcast-options-fields').removeAttr('disabled');
  $('.start').show();
  $('.stop').hide();
}

function positionStreams() {
  var $focusElement;
  $focusElement = $('.focus');
  if ($('#streams').hasClass('vertical')) {
    $('#streams').children().css('top', '0');
    $focusElement.appendTo('#streams');
    $focusElement.css('top', (-20 * ($('#streams').children().size() - 1)) + '%');
  }
  else {
    $focusElement.prependTo('#streams');
    $focusElement.css('top', '0');
  }
}

function setFocus(focusStreamId) {
  var $focusElement;
  var otherStreams = $.map($('#streams').children(), function (element) {
    var streamId = (element.id === 'publisher' && publisher.stream) ? publisher.stream.streamId
      : element.id;
    if (streamId !== focusStreamId) {
      $('#' + element.id).removeClass('focus');
      return streamId;
    }
    return null;
  });

  $.post('/focus', {
    focus: focusStreamId,
    otherStreams: otherStreams
  }).done(function () {
    console.log('Focus changed.');
  }).fail(function (jqXHR) {
    console.error('Stream class list error:', jqXHR.responseText);
  });

  $('.focus').removeClass('focus');
  $focusElement = (publisher.stream && publisher.stream.streamId === focusStreamId) ?
    $('#publisher') : $('#' + focusStreamId);
  $focusElement.addClass('focus');
  session.signal({
    type: 'focusStream',
    data: focusStreamId
  });
  positionStreams();
}

function createFocusClick(elementId, focusStreamId) {
  $('#' + elementId).click(function () {
    setFocus(focusStreamId);
  });
}

if (initialLayout === 'verticalPresentation') {
  $('#streams').addClass('vertical');
}

if (initialLayout === 'verticalPresentation') {
  $('.start').hide();
  $('.stop').show();
}

session.connect(token, function (err) {
  if (err) {
    alert(err.message || err); // eslint-disable-line no-alert
  }
  session.publish(publisher);
});

publisher.on('streamCreated', function () {
  createFocusClick(publisher.id, publisher.stream.streamId);
  positionStreams();
});

session.on('streamCreated', function (event) {
  var subscriber;
  var streamId = event.stream.streamId;
  var $streamContainer = $('<div></div>');
  $streamContainer.attr('id', event.stream.id);
  $('#streams').append($streamContainer);
  subscriber = session.subscribe(event.stream, streamId, {
    insertMode: 'append',
    width: '100%',
    height: '100%'
  });

  if (streamId === focusStreamId) {
    setFocus(streamId);
  }
  createFocusClick(subscriber.id, streamId);
  positionStreams();
});

session.on('streamDestroyed', function (event) {
  var $streamElem = $('#' + event.stream.id);
  if ($streamElem.hasClass('focus')) {
    setFocus(publisher.stream.streamId);
  }
  $streamElem.remove();
  positionStreams();
});

$(document).ready(function () {
  $('.start').click(function () {
    var options = {
      maxDuration: $('input[name=maxDuration]').val() || undefined,
      resolution: $('input[name=resolution]:checked').val(),
      layout: {
        type: layout
      }
    };
    disableForm();
    $.post('/start', options)
      .done(function (response) {
        console.log('start success.');
        broadcastId = response.id;
      })
      .fail(function (jqXHR) {
        console.error(jqXHR.responseText);
        enableForm();
      });
  }).prop('disabled', false);
  $('.stop').click(function () {
    $.get('stop/' + broadcastId)
      .done(function () {
        console.log('stop success.');
        broadcastId = null;
        enableForm();
      })
      .fail(function (jqXHR) {
        console.error(jqXHR.responseText);
      });
  });
  $('.toggle-layout').click(function () {
    if ($('#streams').hasClass('vertical')) {
      $('#streams').removeClass('vertical');
    }
    else {
      $('#streams').addClass('vertical');
    }

    positionStreams();

    layout = $('#streams').hasClass('vertical') ? 'verticalPresentation'
      : 'horizontalPresentation';

    $.post('broadcast/' + broadcastId + '/layout', {
      type: layout
    }).done(function () {
      console.log('Broadcast layout updated.');
    }).fail(function (jqXHR) {
      console.error('Broadcast layout error:', jqXHR.responseText);
    });

    session.signal({
      type: 'layoutClass',
      data: layout
    });
  });
});
