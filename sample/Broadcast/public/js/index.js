/* global OT, apiKey, sessionId, token, $, layout, focusStreamId */
/* eslint-disable no-console */

var session = OT.initSession(apiKey, sessionId);
var publisher = OT.initPublisher('publisher', {
  insertMode: 'append',
  width: '100%',
  height: '100%',
  resolution: '1280x720'
});
var broadcastId = null;

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
  }).fail(function (jqXHR, textStatus, errorThrown) {
    console.error('Stream class list error:', errorThrown);
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

if (layout === 'verticalPresentation') {
  $('#streams').addClass('vertical');
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
      duration: $('input[name=duration]').val() || undefined,
      resolution: $('input[name=resolution]:checked').val()
    };
    disableForm();
    $.post('/start', options)
      .done(function (response) {
        console.log('start success.');
        broadcastId = response.id;
      })
      .fail(function (error) {
        console.log('start failure: ', error);
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
      .fail(function (error) {
        console.log('stop failure: ', error);
      });
  });
  $('.toggle-layout').click(function () {
    var newLayoutClass;

    if ($('#streams').hasClass('vertical')) {
      $('#streams').removeClass('vertical');
    }
    else {
      $('#streams').addClass('vertical');
    }

    positionStreams();

    newLayoutClass = $('#streams').hasClass('vertical') ? 'verticalPresentation'
      : 'horizontalPresentation';

    if (broadcastId) {
      $.post('broadcast/' + broadcastId + '/layout', {
        type: newLayoutClass
      }).done(function () {
        console.log('Broadcast layout updated.');
      }).fail(function (jqXHR) {
        console.error('Broadcast layout error:', jqXHR.responseText);
      });
    }

    session.signal({
      type: 'layoutClass',
      data: newLayoutClass
    });
  });
});
