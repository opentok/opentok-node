var session = OT.initSession(apiKey, sessionId),
    publisher = OT.initPublisher('publisher', { insertMode: 'append' }),
    archiveID = null;
var currentLayoutClass = 'horizontalPresentation'

function toggleLayoutClass() {
  return currentLayoutClass === 'horizontalPresentation' ?
    'verticalPresentation' :
    'horizontalPresentation';
}

function createButton(elementId, streamId) {
  console.log(elementId, streamId)
  var streamElement = document.getElementById(elementId);
  var button = $('<button>Focus</button>');
  button.insertAfter("#" + elementId);
  button.click(function() {
    $.post('session/' + sessionId + '/stream/' + streamId + '/focus').done(function () {
      console.log('Focus changed.');
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
      console.error('Stream class list error:', errorThrown); // -
    });
  });
}

session.connect(token, function(err) {
  if(err) {
    alert(err.message || err);
  }
  session.publish(publisher);
});

publisher.on('streamCreated', function() {
  createButton(publisher.id, publisher.stream.id);
});

session.on('streamCreated', function(event) {
  var streamContainer = document.createElement('div');
  streamContainer.id = event.stream.id;
  document.getElementById('subscribers').appendChild(streamContainer);
  var subscriber = session.subscribe(event.stream, streamContainer, { insertMode: 'append' });
  createButton(subscriber.id, event.stream.id);
});

session.on('streamDestroyed', function(event) {
  var streamContainer = document.getElementById(event.stream.id);
  streamContainer.parentNode.removeChild(streamContainer);
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
