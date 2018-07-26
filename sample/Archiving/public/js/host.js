var session = OT.initSession(apiKey, sessionId),
    publisher = OT.initPublisher('publisher'),
    archiveID = null;
var currentLayoutClass = 'horizontalPresentation'

function toggleLayoutClass() {
  return currentLayoutClass === 'horizontalPresentation' ?
    'verticalPresentation' :
    'horizontalPresentation';
}

session.connect(token, function(err) {
  if(err) {
    alert(err.message || err);
  }
  session.publish(publisher);
});

session.on('streamCreated', function(event) {
  session.subscribe(event.stream, 'subscribers', { insertMode: 'append' });
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
