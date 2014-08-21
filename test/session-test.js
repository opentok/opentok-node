var expect = require('chai').expect,
    nock = require('nock'),
    async = require('async');

// Subject
var Session = require('../lib/session.js'),
    OpenTok = require('../lib/opentok.js');

// Fixtures
var _fakeApiKey = '123456',
  _fakeApiSecret = '1234567890abcdef1234567890abcdef1234567890',
  _fakeSessionId = '1_MX4xMjM0NTZ-flNhdCBNYXIgMTUgMTQ6NDI6MjMgUERUIDIwMTR-MC40OTAxMzAyNX4',
  _fakeProxyUrl = 'http://localhost:8080',
  _badApiKey = 'badkey',
  _badApiSecret = 'badsecret',
  _fakeApiUrl = 'http://mymock.example.com',
  _defaultApiUrl = 'https://api.opentok.com',
  _defaultTimeoutLength = 20000,
  _defaultApiKey = process.env.API_KEY || _fakeApiKey,
  _defaultApiSecret = process.env.API_SECRET || _fakeApiSecret,
  _integrationApiUrl = process.env.API_URL || _defaultApiUrl;

nock.disableNetConnect();

var recording = false;
if (recording) {
  // set these values before changing the above to true
  apiKey = '',
  apiSecret = '';
  nock.enableNetConnect();
  nock.recorder.rec();
}

describe('Session', function() {
  var apiKey = _fakeApiKey,
    apiSecret = _fakeApiSecret,
    sessionId = _fakeSessionId,
    opentok;

  beforeEach(function() {
    opentok = new OpenTok(apiKey, apiSecret);
  });

  it('initializes with no options', function() {
    var session = new Session(opentok, sessionId);
      expect(session).to.be.an.instanceof(Session);
      expect(session.sessionId).to.equal(sessionId);
  });

  describe('when initialized with a media mode', function() {
    it('has a mediaMode property', function() {
      var session = new Session(opentok, sessionId, { mediaMode: "relayed" });
      expect(session).to.be.an.instanceof(Session);
      expect(session.mediaMode).to.equal("relayed");
      session = new Session(opentok, sessionId, { mediaMode: "routed" });
      expect(session).to.be.an.instanceof(Session);
      expect(session.mediaMode).to.equal("routed");
    });
    it('does not have a location property', function() {
      var session = new Session(opentok, sessionId, { mediaMode: "relayed" });
      expect(session).to.be.an.instanceof(Session);
      expect(session.location).to.not.exist
    });
  });

  describe('when initialized with just a location option', function() {
    it('has a location property', function() {
      var session = new Session(opentok, sessionId, { location: '12.34.56.78' });
      expect(session).to.be.an.instanceof(Session);
      expect(session.location).to.equal('12.34.56.78');
    });
    it('does not have a mediaMode property', function() {
      var session = new Session(opentok, sessionId, { location: '12.34.56.78' });
      expect(session).to.be.an.instanceof(Session);
      expect(session.mediaMode).to.not.exist
    });
  });

  describe('#generateToken', function() {
    beforeEach(function() {
      this.session = new Session(opentok, sessionId);
    });
    // TODO: check all the invalid stuff
    it('generates tokens', function() {
      var token = this.session.generateToken();
      expect(token).to.be.a('string');
      // TODO: decode and check its properties
    });
    it('assigns a role in the token', function() {
      var token = this.session.generateToken();
      expect(token).to.be.a('string');
      // TODO: decode and check that its a publisher

      token = this.session.generateToken({role:'subscriber'});
      expect(token).to.be.a('string');
      // TODO: decode and check that its a subscriber
    });
    it('assigns an expire time in the token', function() {
      var token = this.session.generateToken();
      expect(token).to.be.a('string');
      // TODO: decode and check that its expireTime is one day

      var inAWhile =(new Date().getTime() / 1000) + (10);
      token = this.session.generateToken({
        expireTime: inAWhile
      });
      expect(token).to.be.a('string');
      // TODO: decode and check that the time is right
    });
    it('assigns an connection data to the token', function() {
      var token = this.session.generateToken({ data: 'name=Johnny' });
      expect(token).to.be.a('string');
      // TODO: decode and check its data
    });
  });

});
