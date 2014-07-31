var expect = require('chai').expect;


var helpers = require('../test/helpers.js'),
  OpenTok = require('../lib/opentok.js'),
  Session = require('../lib/session.js'),
  package = require('../package.json');

var apiKey = process.env.API_KEY,
  apiSecret = process.env.API_SECRET,
  apiUrl = process.env.API_URL;

if (!apiKey || !apiSecret) {
  throw new Error('This test expects API_KEY and API_SECRET ' +
    'environtment variables to be set');
}

function createOpenTok() {
  if (apiUrl) {
    return new OpenTok(apiKey, apiSecret, apiUrl);
  } else {
    return new OpenTok(apiKey, apiSecret);
  }
}

describe('#archiving', function() {

  var opentok,
    sessionId = 'SESSIONID',
    archiveId = 'ARCHIVEID';

  beforeEach(function(done) {
    opentok = createOpenTok();
    done();
  });

  it('START ARCHIVE: error for a session without connections', function(done) {

    opentok.startArchive(sessionId, function(err, archive) {
      expect(err).not.to.be.null;
      expect(err.message).to.equal('Session not found');
      done();
    });

  });

  it('START ARCHIVE (with options): error for a session without connections', function(done) {

    opentok.startArchive(sessionId, {name: 'Blah'}, function(err, archive) {
      expect(err).not.to.be.null;
      expect(err.message).to.equal('Session not found');
      done();
    });

  });

  it('STOP ARCHIVE: error to stop an archive that does not exist', function(done) {

    opentok.stopArchive(archiveId, function(err, archive) {
      expect(err).not.to.be.null;
      expect(err.message).to.equal('Archive not found');
      done();
    });

  });
    
  it('GET ARCHIVE: error for an archive that does not exist', function(done) {

    opentok.getArchive(archiveId, function(err, archive) {
      expect(err).not.to.be.null;
      expect(err.message).to.equal('Archive not found');
      done();
    });
  });

  it('LIST ARCHIVES: should return a non empty list', function(done) {

    opentok.listArchives(function(err, archives, total) {
      expect(err).to.be.null;
      expect(total).to.be.greaterThan(1);
      expect(archives.length).not.to.be.undefined;
      expect(archives.length).to.be.greaterThan(1);
      done();
    });
  });

  it('LIST ARCHIVES (with count): should return a list with 10 items', function(done) {

    opentok.listArchives({count: 10}, function(err, archives, total) {
      expect(err).to.be.null;
      expect(total).to.be.greaterThan(9);
      expect(archives.length).not.to.be.undefined;
      expect(archives.length).to.be.equal(10);
      done();
    });
  });

  it('LIST ARCHIVES (with count and offset): should return a list with 10 items', function(done) {

    opentok.listArchives({offset: 2, count: 8}, function(err, archives, total) {
      expect(err).to.be.null;
      expect(total).to.be.greaterThan(9);
      expect(archives.length).not.to.be.undefined;
      expect(archives.length).to.be.equal(8);
      done();
    });
  });

  it('DELETE ARCHIVE', function(done) {
    opentok.deleteArchive(archiveId, function(err) {
      expect(err).not.to.be.null;
      expect(err.message).to.equal('Archive not found');
      done();
    });
  });

});