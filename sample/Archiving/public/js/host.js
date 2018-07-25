/* global OT, apiKey, sessionId, token, $ */
/* eslint-disable no-console */
var session = OT.initSession(apiKey, sessionId);
var publisher = OT.initPublisher('publisher');
var archiveID = null;

function disableForm() {
  $('.archive-options-fields').attr('disabled', 'disabled');
}

function enableForm() {
  $('.archive-options-fields').removeAttr('disabled');
}

session.connect(token, function (err) {
  if (err) {
    alert(err.message || err); // eslint-disable-line no-alert
  }
  session.publish(publisher);
});

session.on('streamCreated', function (event) {
  session.subscribe(event.stream, 'subscribers', { insertMode: 'append' });
});

session.on('archiveStarted', function (event) {
  archiveID = event.id;
  console.log('ARCHIVE STARTED');
  $('.start').hide();
  $('.stop').show();
  disableForm();
});

session.on('archiveStopped', function () {
  archiveID = null;
  console.log('ARCHIVE STOPPED');
  $('.start').show();
  $('.stop').hide();
  enableForm();
});

$(document).ready(function () {
  $('.start').click(function () {
    var options = $('.archive-options').serialize();
    disableForm();
    $.post('/start', options).fail(enableForm);
  }).show();
  $('.stop').click(function () {
    $.get('stop/' + archiveID);
  }).hide();
});
