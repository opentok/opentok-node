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

describe('#session', function() {

  var opentok;
  beforeEach(function(done) {
    opentok = createOpenTok();
    done();
  });

  it('creates a new session', function(done) {

    var sessionProperties = {
      apiKey: apiKey,
      mediaMode: 'relayed'
    };

    opentok.createSession(function(err, session){
      if (err) {
        return done(err);
      }
      expect(session).to.be.an.instanceof(Session);
      expect(helpers.validateSession(session, sessionProperties)).to.beTrue;
      done();
    });
  });

  it('creates a media routed session', function(done) {

    var sessionProperties = {
      apiKey: apiKey,
      mediaMode: 'routed'
    };

    opentok.createSession({ 'mediaMode' : 'routed' }, function(err, session) {
      if (err) {
        return done(err);
      }
      expect(session).to.be.an.instanceof(Session);
      expect(helpers.validateSession(session, sessionProperties)).to.beTrue;
      done();
    });
  });

  it('creates a media relayed session even if the media mode is invalid', function(done) {

    var sessionProperties = {
      apiKey: apiKey,
      mediaMode: 'relayed'
    };

    opentok.createSession({ 'mediaMode' : 'blah' }, function(err, session) {
      if (err) {
        return done(err);
      }
      expect(session).to.be.an.instanceof(Session);
      expect(helpers.validateSession(session, sessionProperties)).to.beTrue;
      done();
    });
  });

  it('adds a location hint to the created session', function(done) {

    var sessionProperties = {
      apiKey: apiKey,
      mediaMode: 'relayed',
      location: '12.34.56.78'
    };

      // passes location: '12.34.56.78'
    opentok.createSession({ 'location': '12.34.56.78' }, function(err, session) {
      if (err) {
        return done(err);
      }
      expect(session).to.be.an.instanceof(Session);
      expect(helpers.validateSession(session, sessionProperties)).to.be.true;
      done();
    });
  });

  it('complains when the location value is not valid', function(done) {
    opentok.createSession({ location: 'not an ip address' }, function(err) {
      expect(err).to.be.an.instanceof(Error);
      done();
    });
  });

  it('complains when there is no callback function', function() {
    expect(function() {
      var result = opentok.createSession();
    }).to.throw(Error);
  });

});
