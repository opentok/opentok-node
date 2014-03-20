var expect = require('chai').expect,
    nock = require('nock');

// Subject
var OpenTok = require('../lib/opentok.js'),
    package = require('../package.json');

// Fixtures
var apiKey = '123456',
    apiSecret = '1234567890abcdef1234567890abcdef1234567890';

var recording = false;
if (recording) {
  // set these values before changing the above to true
  apiKey = '',
  apiSecret = '';
  nock.recorder.rec();
}

describe('OpenTok', function() {
  it('should initialize with a valid apiKey and apiSecret', function() {
    var opentok = new OpenTok(apiKey, apiSecret);
    expect(opentok).to.be.an.instanceof(OpenTok);
  });
  it('should initialize without `new`', function() {
    var opentok = OpenTok(apiKey, apiSecret);
    expect(opentok).to.be.an.instanceof(OpenTok);
  });
  it('should not initialize with just an apiKey but no apiSecret', function() {
    var opentok = new OpenTok(apiKey);
    expect(opentok).to.not.be.an.instanceof(OpenTok);
  });
  it('should not initialize with incorrect type parameters', function() {
    var opentok = new OpenTok(new Date(), 'asdasdasdasdasd');
    expect(opentok).to.not.be.an.instanceof(OpenTok);
    opentok = new OpenTok(4, {});
    expect(opentok).to.not.be.an.instanceof(OpenTok);
  });
  it('should cooerce a number for the apiKey', function() {
    var opentok = new OpenTok(parseInt(apiKey), apiSecret);
    expect(opentok).to.be.an.instanceof(OpenTok);
  });

  describe('when initialized with an apiUrl', function() {
    it('sends its requests to the set apiUrl', function(done) {
      done();
    });
  });

  describe('#createSession', function() {

    beforeEach(function() {
      this.opentok = new OpenTok(apiKey, apiSecret);
    });

    it('creates a new session', function(done) {
      var scope = nock('https://api.opentok.com:443')
        .matchHeader('x-tb-partner-auth', apiKey+':'+apiSecret)
        .matchHeader('user-agent', new RegExp("OpenTok-Node-SDK\/"+package.version))
        .post('/hl/session/create', "p2p.preference=false")
        .reply(200, "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><sessions><Session><session_id>SESSIONID</session_id><partner_id>123456</partner_id><create_dt>Wed Mar 19 23:35:24 PDT 2014</create_dt></Session></sessions>", { server: 'nginx',
        date: 'Thu, 20 Mar 2014 06:35:24 GMT',
        'content-type': 'text/xml',
        connection: 'keep-alive',
        'access-control-allow-origin': '*',
        'x-tb-host': 'mantis503-nyc.tokbox.com',
        'content-length': '211' });
      // pass no options parameter
      this.opentok.createSession(function(err, session){
        expect(session).to.be.a('string');
        expect(session).to.equal('SESSIONID');
        scope.done();
        done(err);
      });
    });

    it('creates a peer to peer session', function(done) {
      // 2 expectations: if a session created without the flag isn't peer to peer,
      //                 if a session created with the flag is peer to peer
      // try passing an invalid value to the p2p flag
      var scope = nock('https://api.opentok.com:443')
        .matchHeader('x-tb-partner-auth', apiKey+':'+apiSecret)
        .matchHeader('user-agent', new RegExp("OpenTok-Node-SDK\/"+package.version))
        .post('/hl/session/create', "p2p.preference=true")
        .reply(200, "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><sessions><Session><session_id>SESSIONID</session_id><partner_id>123456</partner_id><create_dt>Thu Mar 20 07:02:45 PDT 2014</create_dt></Session></sessions>", { server: 'nginx',
        date: 'Thu, 20 Mar 2014 14:02:45 GMT',
        'content-type': 'text/xml',
        connection: 'keep-alive',
        'access-control-allow-origin': '*',
        'x-tb-host': 'oms506-nyc.tokbox.com',
        'content-length': '211' });
      this.opentok.createSession({ 'p2p' : true }, function(err, session) {
        expect(session).to.be.a('string');
        expect(session).to.equal('SESSIONID');
        scope.done();
        done(err);
      });
    });

    it('adds a location hint to the created session', function(done) {
      // 2 expectations: if a session created without the hint doesn't have a hint,
      //                 if a session created with the hint has the hint
      // try passing an invalid hint
      done();
    });

    it('complains when the p2p or location values are not valid', function(done) {
      done();
    });

    it('complains when there is no callback function', function(done) {
      done();
    });

    it('compains when a server error takes place', function(done) {
      done();
    });

  });


  describe('#generateToken', function() {

    var sessionId;
    var opentok = new OpenTok('123456', 'APISECRET');

    beforeEach(function(done) {
      // TODO: use a stub here instead of making a real request
      //opentok.createSession(function(err, freshSessionId) {
      //  sessionId = freshSessionId;
        done();
      //});
    });

    it('generates a token', function() {
      // call generateToken with no options
      //var token = opentok.generateToken(sessionId);
      //assert.ok(typeof token == 'string');
      // TODO: decode token and verify signature
    });

    it('assigns a role in the token', function() {
      // expects one with no role defined to assign "publisher"
      //var defaultRoleToken = opentok.generateToken(sessionId);
      // TODO: decode token, verify signature, make sure "role" matches 'publisher'
      // expects one with a valid role defined to set it
      //var subscriberToken = opentok.generateToken(sessionId, { role : 'subscriber' });
      // TODO: decode token, verify signature, make sure "role" matches 'subscriber'
      // expects one with an invalid role to complain
      //var invalidToken = opentok.generateToken(sessionId, { role : 5 });
      //assert.ok(invalidToken === false);
    });

    it('sets an expiration time for the token', function() {
      // expects a token with no expiration time to assign 1 day
      // expects a token with an expiration time to have it
      // expects a token with an invalid expiration time to complain
    });

    it('sets connection data in the token', function() {
      // expects a token with no connection data to have none
      // expects a token with a connection data to have it
      // expects a token with invalid connection to complain
    });

    it('complains if the sessionId is not valid', function() {
      // complains if there is no sessionId
      // complains if the sessionId doesn't belong to the apiKey
    });

    it('contains a unique nonce', function() {
      // generate a few and show the nonce exists each time and that they are different
    });
  });

  // existence of constants on the constructor and the instance


});
