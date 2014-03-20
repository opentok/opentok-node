var expect = require('chai').expect;

// Subject
var OpenTok = require('../lib/opentok.js');

// Fixtures
var apiKey = '123456',
    apiSecret = '1234567890abcdef1234567890abcdef1234567890';


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


  describe('#createSession', function() {

    it('creates a new session', function(done) {
      // pass no options parameter
      done();
    });

    it('creates a peer to peer session', function(done) {
      // 2 expectations: if a session created without the flag isn't peer to peer,
      //                 if a session created with the flag is peer to peer
      // try passing an invalid value to the p2p flag
      done();
    });

    it('adds a location hint to the created session', function(done) {
      // 2 expectations: if a session created without the hint doesn't have a hint,
      //                 if a session created with the hint has the hint
      // try passing an invalid hint
      done();
    });

    it('optionally takes a config parameter', function(done) {
      // creates a session without the config param
      // creates a session with a config param
      // doesn't pass unidentified options to the server
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
