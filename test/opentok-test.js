var expect = require('chai').expect,
  nock = require('nock'),
  _ = require('lodash'),
  async = require('async');

var OpenTok = require('../lib/opentok.js'),
  Session = require('../lib/session.js'),
  package = require('../package.json');

var _fakeApiKey = '123456',
  _fakeApiSecret = '1234567890abcdef1234567890abcdef1234567890',
  _fakeSessionId = '1_MX4xMjM0NTZ-flNhdCBNYXIgMTUgMTQ6NDI6MjMgUERUIDIwMTR-MC40OTAxMzAyNX4',
  _fakeArchiveId = 'ARCHIVE_ID',
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

// Modes
var recording = process.env.RECORDING || false;
var networkAttached = process.env.NETWORK || recording || false;

// Network-attached mode (implied by recording mode)
if (networkAttached) {
  nock.enableNetConnect();

  if (!process.env.API_KEY || !process.env.API_SECRET) {
    throw Error('When running tests in this mode, you must define an API_KEY and an API_SECRET'+
                'environment variable');
  }
}

// Recording mode
if (recording) {
  nock.recorder.rec();
}

var helpers = require('./helpers.js'),
    attachableNock = helpers.getAttachableNock(nock, networkAttached);

describe('OpenTok', function() {

  describe('Testing the opentok constructor', function() {
    var apiKey = _defaultApiKey,
      apiSecret = _defaultApiSecret,
      apiUrl = _defaultApiUrl;

    it('should initialize with a valid apiKey and apiSecret', function() {
      var opentok = new OpenTok(apiKey, apiSecret);
      expect(opentok).to.be.an.instanceof(OpenTok);
      expect(opentok.apiKey).to.be.equal(apiKey);
      expect(opentok.apiSecret).to.be.equal(apiSecret);
      expect(opentok.apiUrl).to.be.equal(apiUrl);
    });

    it('should initialize without `new`', function() {
      var opentok = OpenTok(apiKey, apiSecret);
      expect(opentok).to.be.an.instanceof(OpenTok);
    });

    it('should not initialize with just an apiKey but no apiSecret', function() {
      expect(function() {
        var opentok = new OpenTok(apiKey);
      }).to.throw(Error);
    });

    it('should not initialize with incorrect type parameters', function() {
      expect(function() {
        var opentok = new OpenTok(new Date(), 'asdasdasdasdasd');
      }).to.throw(Error);
      expect(function() {
        opentok = new OpenTok(4, {});
      }).to.throw(Error);
    });

    it('should cooerce a number for the apiKey', function() {
      var opentok = new OpenTok(parseInt(apiKey), apiSecret);
      expect(opentok).to.be.an.instanceof(OpenTok);
    });

    it('exposes the custom apiUrl', function() {
      var opentok = new OpenTok(parseInt(apiKey), apiSecret);
      expect(opentok.apiUrl).to.be.equal(apiUrl);
    });
  });

  describe('when initialized with an apiUrl', function() {
    var apiKey = _defaultApiKey,
      apiSecret = _defaultApiSecret,
      sessionId = _fakeSessionId,
      apiUrl = _defaultApiUrl,
      opentok;

    beforeEach(function() {
      opentok = new OpenTok(apiKey, apiSecret);
    });

    it('sends its requests to the set apiUrl', function(done) {
      var scope = attachableNock(apiUrl)
        .matchHeader('x-tb-partner-auth', apiKey + ':' + apiSecret)
        .matchHeader('user-agent', new RegExp('OpenTok-Node-SDK\/' + package.version))
        .post('/session/create', 'p2p.preference=enabled')
        .reply(200, "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><sessions><Session><session_id>" +
          sessionId + "</session_id><partner_id>123456</partner_id><create_dt>Wed Mar 19 23:35:24 PDT 2014</create_dt></Session></sessions>", { server: 'nginx',
        date: 'Thu, 20 Mar 2014 06:35:24 GMT',
        'content-type': 'text/xml',
        connection: 'keep-alive',
        'access-control-allow-origin': '*',
        'x-tb-host': 'mantis503-nyc.tokbox.com',
        'content-length': '211' });

      opentok.createSession(function(err, session) {

        if (err) return done(err);
        expect(session).to.be.an.instanceof(Session);
        if (!networkAttached) {
          expect(session.sessionId).to.equal(sessionId);
        }
        scope.done();
        done(err);
      });
    });
  });

  describe('when initialized with a proxy', function() {

    var apiKey = _defaultApiKey,
      apiSecret = _defaultApiSecret,
      sessionId = _fakeSessionId,
      proxyUrl = _fakeProxyUrl,
      apiUrl = _defaultApiUrl,
      opentok;

    beforeEach(function() {
      // TODO: remove temporary proxy value
      opentok = new OpenTok(apiKey, apiSecret, { proxy: proxyUrl });
    });

    it('sends its requests through an http proxy', function(done) {
      this.timeout(10000);
      var scope = nock(apiUrl)
        .post('/session/create', "p2p.preference=enabled")
        .reply(200, "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><sessions><Session><session_id>" + sessionId + "</session_id><partner_id>854511</partner_id><create_dt>Sun Jul 13 21:26:35 PDT 2014</create_dt></Session></sessions>", { server: 'nginx',
        date: 'Mon, 14 Jul 2014 04:26:35 GMT',
        'content-type': 'application/xml',
        connection: 'keep-alive',
        'access-control-allow-origin': '*',
        'x-tb-host': 'mantis402-oak.tokbox.com',
        'content-length': '274' });
      opentok.createSession(function(err, session) {
        scope.done();
        expect(session).to.be.an.instanceof(Session);
        done(err);
      });
    });
  });

  // describe('when there is too much network latency', function() {

  //   var apiKey = _defaultApiKey,
  //     apiSecret = _defaultApiSecret,
  //     apiUrl = _defaultApiUrl,
  //     sessionId = _fakeSessionId,
  //     proxyUrl = _fakeProxyUrl,
  //     timeout = _defaultTimeoutLength,
  //     opentok;

  //   beforeEach(function() {
  //     opentok = new OpenTok(apiKey, apiSecret);
  //   });

  //   it('times out when the request takes longer than the default timeout', function(done) {
  //     // make sure the mocha test runner doesn't time out for at least as long as we are willing to
  //     // wait plus some reasonable amount of overhead time (100ms)
  //     this.timeout(timeout + 100);
  //     var scope = nock(apiUrl)
  //       .post('/session/create', "p2p.preference=enabled")
  //       .delayConnection(timeout + 10)
  //       .reply(200, "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><sessions><Session><session_id>" + sessionId + "</session_id><partner_id>854511</partner_id><create_dt>Sun Jul 13 21:26:35 PDT 2014</create_dt></Session></sessions>", { server: 'nginx',
  //       date: 'Mon, 14 Jul 2014 04:26:35 GMT',
  //       'content-type': 'application/xml',
  //       connection: 'keep-alive',
  //       'access-control-allow-origin': '*',
  //       'x-tb-host': 'mantis402-oak.tokbox.com',
  //       'content-length': '274' });
  //     opentok.createSession(function(err, session) {
  //       expect(err).to.be.an.instanceof(Error);
  //       scope.done();
  //       done();
  //     });
  //   });
  // });


  describe('#createSession', function() {

    var apiKey = _defaultApiKey,
      apiSecret = _defaultApiSecret,
      sessionId = _fakeSessionId,
      apiUrl = _integrationApiUrl,
      opentok;

    beforeEach(function() {
      opentok = OpenTok(apiKey, apiSecret, apiUrl);
    });

    it('creates a new session, integrates', function(done) {
      var scope = attachableNock(apiUrl)
        .matchHeader('x-tb-partner-auth', apiKey+':'+apiSecret)
        .matchHeader('user-agent', new RegExp("OpenTok-Node-SDK\/"+package.version))
        .post('/session/create', "p2p.preference=enabled")
        .reply(200, "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><sessions><Session><session_id>" + sessionId + "</session_id><partner_id>123456</partner_id><create_dt>Wed Mar 19 23:35:24 PDT 2014</create_dt></Session></sessions>", { server: 'nginx',
        date: 'Thu, 20 Mar 2014 06:35:24 GMT',
        'content-type': 'text/xml',
        connection: 'keep-alive',
        'access-control-allow-origin': '*',
        'x-tb-host': 'mantis503-nyc.tokbox.com',
        'content-length': '211' });
      // pass no options parameter
      opentok.createSession(function(err, session){
        if (err) return done(err);
        expect(session).to.be.an.instanceof(Session);
        if (!networkAttached) {
          expect(session.sessionId).to.equal(sessionId);
        }
        expect(session.mediaMode).to.equal('relayed');
        scope.done();
        done(err);
      });
    });

    it('creates a media routed session, integrates', function(done) {
      var scope = attachableNock(apiUrl)
        .matchHeader('x-tb-partner-auth', apiKey+':'+apiSecret)
        .matchHeader('user-agent', new RegExp("OpenTok-Node-SDK\/"+package.version))
        .post('/session/create', "p2p.preference=disabled")
        .reply(200, "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><sessions><Session><session_id>" + sessionId + "</session_id><partner_id>123456</partner_id><create_dt>Thu Mar 20 07:02:45 PDT 2014</create_dt></Session></sessions>", { server: 'nginx',
        date: 'Thu, 20 Mar 2014 14:02:45 GMT',
        'content-type': 'text/xml',
        connection: 'keep-alive',
        'access-control-allow-origin': '*',
        'x-tb-host': 'oms506-nyc.tokbox.com',
        'content-length': '211' });
      opentok.createSession({ 'mediaMode' : 'routed' }, function(err, session) {
        if (err) return done(err);
        expect(session).to.be.an.instanceof(Session);
        if (!networkAttached) {
          expect(session.sessionId).to.equal(sessionId);
        }
        expect(session.mediaMode).to.equal('routed');
        scope.done();
        done(err);
      });
    });

    it('creates a media relayed session even if the media mode is invalid, integrates', function(done) {
      var scope = attachableNock(apiUrl)
        .matchHeader('x-tb-partner-auth', apiKey+':'+apiSecret)
        .matchHeader('user-agent', new RegExp("OpenTok-Node-SDK\/"+package.version))
        .post('/session/create', "p2p.preference=enabled")
        .reply(200, "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><sessions><Session><session_id>" + sessionId + "</session_id><partner_id>123456</partner_id><create_dt>Thu Mar 20 07:02:45 PDT 2014</create_dt></Session></sessions>", { server: 'nginx',
        date: 'Thu, 20 Mar 2014 14:02:45 GMT',
        'content-type': 'text/xml',
        connection: 'keep-alive',
        'access-control-allow-origin': '*',
        'x-tb-host': 'oms506-nyc.tokbox.com',
        'content-length': '211' });

      opentok.createSession({ 'mediaMode' : 'blah' }, function(err, session) {
        if (err) return done(err);
        expect(session).to.be.an.instanceof(Session);
        if (!networkAttached) {
          expect(session.sessionId).to.equal(sessionId);
        }
        expect(session.mediaMode).to.equal('relayed');
        scope.done();
        done(err);
      });
    });

    it('adds a location hint to the created session, integrates', function(done) {
      var scope = attachableNock(apiUrl)
        .matchHeader('x-tb-partner-auth', apiKey + ':' + apiSecret)
        .matchHeader('user-agent', new RegExp("OpenTok-Node-SDK\/"+package.version))
        .post('/session/create', "location=12.34.56.78&p2p.preference=enabled")
        .reply(200, "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><sessions><Session><session_id>" + sessionId + "</session_id><partner_id>123456</partner_id><create_dt>Thu Mar 20 07:17:22 PDT 2014</create_dt></Session></sessions>", { server: 'nginx',
        date: 'Thu, 20 Mar 2014 14:17:22 GMT',
        'content-type': 'text/xml',
        connection: 'keep-alive',
        'access-control-allow-origin': '*',
        'x-tb-host': 'oms506-nyc.tokbox.com',
        'content-length': '211' });
      // passes location: '12.34.56.78'
      opentok.createSession({ 'location': '12.34.56.78' }, function(err, session) {
        if (err) return done(err);
        expect(session).to.be.an.instanceof(Session);
        if (!networkAttached) {
          expect(session.sessionId).to.equal(sessionId);
        }
        expect(session.mediaMode).to.equal('relayed');
        expect(session.location).to.equal('12.34.56.78');
        scope.done();
        done(err);
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

    it('complains when a server error takes place', function(done) {
      var scope = nock(apiUrl)
        .matchHeader('x-tb-partner-auth', apiKey+':'+apiSecret)
        .matchHeader('user-agent', new RegExp("OpenTok-Node-SDK\/"+package.version))
        .post('/session/create', "p2p.preference=enabled")
        .reply(500, "", { server: 'nginx',
        date: 'Thu, 20 Mar 2014 06:35:24 GMT',
        'content-type': 'text/xml',
        connection: 'keep-alive',
        'access-control-allow-origin': '*',
        'x-tb-host': 'mantis503-nyc.tokbox.com',
        'content-length': '0' });
      opentok.createSession(function(err, session) {
        expect(err).to.be.an.instanceof(Error);
        scope.done();
        done();
      });
    });
  });


  describe('#generateToken', function() {

    var apiKey = _fakeApiKey,
      apiSecret = _fakeApiSecret,
      sessionId = _fakeSessionId;

    beforeEach(function() {
      opentok = new OpenTok(apiKey, apiSecret);
    });

    it('generates a token', function() {
      // call generateToken with no options
      var token = opentok.generateToken(sessionId);
      expect(token).to.be.a('string');
      expect(helpers.verifyTokenSignature(token, apiSecret)).to.be.true;
      var decoded = helpers.decodeToken(token);
      expect(decoded.partner_id).to.equal(apiKey);
      expect(decoded.create_time).to.exist;
      expect(decoded.nonce).to.exist;
    });

    it('assigns a role in the token', function() {
      // expects one with no role defined to assign "publisher"
      var defaultRoleToken = opentok.generateToken(sessionId);
      expect(defaultRoleToken).to.be.a('string');
      expect(helpers.verifyTokenSignature(defaultRoleToken, apiSecret)).to.be.true
      var decoded = helpers.decodeToken(defaultRoleToken);
      expect(decoded.role).to.equal('publisher');

      // expects one with a valid role defined to set it
      var subscriberToken = opentok.generateToken(sessionId, { role : 'subscriber' });
      expect(subscriberToken).to.be.a('string');
      expect(helpers.verifyTokenSignature(subscriberToken, apiSecret)).to.be.true
      decoded = helpers.decodeToken(subscriberToken);
      expect(decoded.role).to.equal('subscriber');

      // expects one with an invalid role to complain
      var invalidToken = opentok.generateToken(sessionId, { role : 5 });
      expect(invalidToken).to.not.be.ok
    });

    it('sets an expiration time for the token', function() {
      // expects a token with no expiration time to assign 1 day
      var now = (new Date().getTime()) / 1000, delta = 10,
          inOneDay = now + (60*60*24);
      var defaultExpireToken = opentok.generateToken(sessionId);
      expect(defaultExpireToken).to.be.a('string');
      expect(helpers.verifyTokenSignature(defaultExpireToken, apiSecret)).to.be.true
      var decoded = helpers.decodeToken(defaultExpireToken);
      expect(decoded.expire_time).to.be.within(inOneDay-delta, inOneDay+delta);

      // expects a token with an expiration time to have it
      var expireTime = (new Date().getTime() / 1000) + (60*60); // 1 hour
      var oneHourToken = opentok.generateToken(sessionId, { expireTime: expireTime });
      expect(oneHourToken).to.be.a('string');
      expect(helpers.verifyTokenSignature(oneHourToken, apiSecret)).to.be.true
      decoded = helpers.decodeToken(oneHourToken);
      expect(decoded.expire_time).to.be.within(expireTime-delta, expireTime+delta);

      // expects a token with an invalid expiration time to complain
      var invalidToken = opentok.generateToken(sessionId, { expireTime: "not a time" });
      expect(invalidToken).to.not.be.ok;

      // TODO: expects a token with a time to thats in the past to complain
      //invalidToken = opentok.generateToken(sessionId, { expireTime: "not a time" });
      //expect(invalidToken).to.not.be.ok;
    });

    it('sets connection data in the token', function() {
      // expects a token with a connection data to have it
      var sampleData = 'name=Johnny';
      var dataBearingToken = opentok.generateToken(sessionId, { data: sampleData });
      expect(dataBearingToken).to.be.a('string');
      expect(helpers.verifyTokenSignature(dataBearingToken, apiSecret)).to.be.true
      var decoded = helpers.decodeToken(dataBearingToken);
      expect(decoded.connection_data).to.equal(sampleData);

      // expects a token with invalid connection to complain
      var invalidToken = opentok.generateToken(sessionId, { data: { 'dont': 'work' } });
      expect(invalidToken).to.not.be.ok;

      var tooLongDataToken = opentok.generateToken(sessionId, {
        data: Array(2000).join("a") // 1999 char string of all 'a's
      });
      expect(tooLongDataToken).to.not.be.ok;
    });

    it('complains if the sessionId is not valid', function() {
      var badToken = opentok.generateToken();
      expect(badToken).to.not.be.ok;

      badToken = opentok.generateToken('blahblahblah');
      expect(badToken).to.not.be.ok;
    });

    it('contains a unique nonce', function() {
      // generate a few and show the nonce exists each time and that they are different
      var tokens = [
        opentok.generateToken(sessionId),
        opentok.generateToken(sessionId)
      ];
      var nonces = _.map(tokens, function(token) { return helpers.decodeToken(token).nonce; });
      expect(_.uniq(nonces)).to.have.length(nonces.length);
    });
  });

  describe('Successful archiving calls', function() {

    var opentok,
      sessionId = _fakeSessionId,
      archiveId = _fakeArchiveId,
      apiKey = _fakeApiKey,
      apiSecret = _fakeApiSecret;
      archiveId = _fakeArchiveId,
      apiUrl = _defaultApiUrl;

    beforeEach(function() {
      opentok = new OpenTok(apiKey, apiSecret);
    });

    it('#startArchive starts archive', function(done) {
      var scope = nock(apiUrl)
        .matchHeader('x-tb-partner-auth', apiKey + ':' + apiSecret)
        .matchHeader('user-agent', new RegExp("OpenTok-Node-SDK\/"+package.version))
        .post('/v2/partner/' + apiKey + '/archive')
          .reply(200, JSON.stringify({
            id : archiveId,
            status : "started",
            name : "",
            statusMessage : "",
            sessionId : "1_MX4xMDB-flRodSBBdWcgMjEgMTQ6NTk6MDggUERUIDIwMTR-MC42NjQ4ODYzNn5-",
            partnerId : 100,
            createdAt : 1408658353395,
            size : 0,
            duration : 0,
            mode : "automatic",
            updatedAt : 1408658353395,
            url : null
        }),
        { server: 'nginx',
        date: 'Thu, 20 Mar 2014 14:17:22 GMT',
        'content-type': 'text/xml',
        connection: 'keep-alive',
        'access-control-allow-origin': '*',
        'x-tb-host': 'oms506-nyc.tokbox.com'});

      opentok.startArchive(sessionId, function(err, archive) {
        expect(err).to.be.null;
        expect(archive.id).to.equal(archiveId);
        expect(archive.status).to.equal('started');
        done();
      });
    });

    it('#stopArchive stops archive', function(done) {
      var scope = nock(apiUrl)
        .matchHeader('x-tb-partner-auth', apiKey + ':' + apiSecret)
        .matchHeader('user-agent', new RegExp("OpenTok-Node-SDK\/"+package.version))
        .post('/v2/partner/' + apiKey + '/archive/' + archiveId + '/stop')
          .reply(200, JSON.stringify({
            id : archiveId,
            status : "stopped",
            name : "",
            statusMessage : "",
            sessionId : "1_MX4xMDB-flRodSBBdWcgMjEgMTQ6NTk6MDggUERUIDIwMTR-MC42NjQ4ODYzNn5-",
            partnerId : 100,
            createdAt : 1408658353395,
            size : 0,
            duration : 0,
            mode : "automatic",
            updatedAt : 1408658353395,
            url : null
        }),
        { server: 'nginx',
        date: 'Thu, 20 Mar 2014 14:17:22 GMT',
        'content-type': 'text/xml',
        connection: 'keep-alive',
        'access-control-allow-origin': '*',
        'x-tb-host': 'oms506-nyc.tokbox.com'});

      opentok.stopArchive(archiveId, function(err, archive) {
        scope.done();
        expect(err).to.be.null;
        expect(archive.id).to.equal(archiveId);
        expect(archive.status).to.equal('stopped');
        done();
      });
    });

    it('#getArchive retrieves archive', function(done) {
      var scope = nock(apiUrl)
        .matchHeader('x-tb-partner-auth', apiKey + ':' + apiSecret)
        .matchHeader('user-agent', new RegExp("OpenTok-Node-SDK\/"+package.version))
        .get('/v2/partner/' + apiKey + '/archive/' + archiveId)
          .reply(200, JSON.stringify({
            id : archiveId,
            status : "available",
            name : "",
            statusMessage : "",
            sessionId : "1_MX4xMDB-flRodSBBdWcgMjEgMTQ6NTk6MDggUERUIDIwMTR-MC42NjQ4ODYzNn5-",
            partnerId : 100,
            createdAt : 1408658353395,
            size : 0,
            duration : 0,
            mode : "automatic",
            updatedAt : 1408658353395,
            url : null
        }),
        { server: 'nginx',
        date: 'Thu, 20 Mar 2014 14:17:22 GMT',
        'content-type': 'text/xml',
        connection: 'keep-alive',
        'access-control-allow-origin': '*',
        'x-tb-host': 'oms506-nyc.tokbox.com'});

      opentok.getArchive(archiveId, function(err, archive) {
        scope.done();
        expect(err).to.be.null;
        expect(archive.id).to.equal(archiveId);
        expect(archive.status).to.equal('available');
        done();
      });
    });

    it('#deleteArchive deletes archive', function(done) {
      var scope = nock(apiUrl)
        .matchHeader('x-tb-partner-auth', apiKey + ':' + apiSecret)
        .matchHeader('user-agent', new RegExp("OpenTok-Node-SDK\/"+package.version))
        .delete('/v2/partner/' + apiKey + '/archive/' + archiveId)
          .reply(204, 
        { server: 'nginx',
        date: 'Thu, 20 Mar 2014 14:17:22 GMT',
        'content-type': 'text/xml',
        connection: 'keep-alive',
        'access-control-allow-origin': '*',
        'x-tb-host': 'oms506-nyc.tokbox.com'});

      opentok.deleteArchive(archiveId, function(err) {
        scope.done();
        expect(err).to.be.null;
        done();
      });
    });

  });

  describe('Error archiving calls', function() {
    var opentok,
      sessionId = _fakeSessionId,
      archiveId = _fakeArchiveId,
      apiKey = _defaultApiKey,
      apiSecret = _defaultApiSecret,
      apiUrl = _defaultApiUrl;

    beforeEach(function() {
      opentok = new OpenTok(apiKey, apiSecret);
    });

    it('#startArchive error for a session without connections', function(done) {

      var scope = attachableNock(apiUrl)
        .matchHeader('x-tb-partner-auth', apiKey + ':' + apiSecret)
        .matchHeader('user-agent', new RegExp("OpenTok-Node-SDK\/"+package.version))
        .post('/v2/partner/' + apiKey + '/archive')
        .reply(404, "{ message: 'Not found' }", { server: 'nginx',
        date: 'Thu, 20 Mar 2014 14:17:22 GMT',
        'content-type': 'text/xml',
        connection: 'keep-alive',
        'access-control-allow-origin': '*',
        'x-tb-host': 'oms506-nyc.tokbox.com'});

      opentok.startArchive(sessionId, function(err, archive) {
        expect(err).not.to.be.null;
        done();
      });
    });

    it('#startArchive with options should fail for a session without connections', function(done) {

      var scope = attachableNock(apiUrl)
        .matchHeader('x-tb-partner-auth', apiKey + ':' + apiSecret)
        .matchHeader('user-agent', new RegExp("OpenTok-Node-SDK\/"+package.version))
        .post('/v2/partner/' + apiKey + '/archive')
        .reply(404, "{ message: 'Not found' }", { server: 'nginx',
        date: 'Thu, 20 Mar 2014 14:17:22 GMT',
        'content-type': 'text/xml',
        connection: 'keep-alive',
        'access-control-allow-origin': '*',
        'x-tb-host': 'oms506-nyc.tokbox.com'});

      opentok.startArchive(sessionId, {name: 'Blah'}, function(err, archive) {
        expect(err).not.to.be.null;
        done();
      });
    });


    it('#stopArchive fails for invalid archive', function(done) {

      var scope = attachableNock(apiUrl)
        .matchHeader('x-tb-partner-auth', apiKey + ':' + apiSecret)
        .matchHeader('user-agent', new RegExp("OpenTok-Node-SDK\/"+package.version))
        .post('/v2/partner/' + apiKey + '/archive/' + archiveId + '/stop')
        .reply(404, "{ message: 'Not found' }", { server: 'nginx',
        date: 'Thu, 20 Mar 2014 14:17:22 GMT',
        'content-type': 'text/xml',
        connection: 'keep-alive',
        'access-control-allow-origin': '*',
        'x-tb-host': 'oms506-nyc.tokbox.com'});

      opentok.stopArchive(archiveId, function(err, archive) {
        expect(err).not.to.be.null;
        expect(err.message).to.equal('Archive not found');
        done();
      });
    });

    it('#getArchive fails for invalid archive', function(done) {

      var scope = attachableNock(apiUrl)
        .matchHeader('x-tb-partner-auth', apiKey + ':' + apiSecret)
        .matchHeader('user-agent', new RegExp("OpenTok-Node-SDK\/"+package.version))
        .get('/v2/partner/' + apiKey + '/archive/' + archiveId)
        .reply(404, "{ message: 'Not found' }", { server: 'nginx',
        date: 'Thu, 20 Mar 2014 14:17:22 GMT',
        'content-type': 'text/xml',
        connection: 'keep-alive',
        'access-control-allow-origin': '*',
        'x-tb-host': 'oms506-nyc.tokbox.com'});

      opentok.getArchive(archiveId, function(err, archive) {
        expect(err).not.to.be.null;
        expect(err.message).to.equal('Archive not found');
        done();
      });
    });


    it('#deleteArchive fails for invalid archive', function(done) {

      var scope = attachableNock(apiUrl)
        .matchHeader('x-tb-partner-auth', apiKey + ':' + apiSecret)
        .matchHeader('user-agent', new RegExp("OpenTok-Node-SDK\/"+package.version))
        .delete('/v2/partner/' + apiKey + '/archive/' + archiveId)
        .reply(404, "{ message: 'Not found' }", { server: 'nginx',
        date: 'Thu, 20 Mar 2014 14:17:22 GMT',
        'content-type': 'text/xml',
        connection: 'keep-alive',
        'access-control-allow-origin': '*',
        'x-tb-host': 'oms506-nyc.tokbox.com'});

      opentok.deleteArchive(archiveId, function(err, archive) {
        expect(err).not.to.be.null;
        expect(err.message).to.equal('Archive not found');
        done();
      });
    });

    it('#listArchives returns list of archives', function(done) {

      var scope = attachableNock(apiUrl)
        .matchHeader('x-tb-partner-auth', apiKey + ':' + apiSecret)
        .matchHeader('user-agent', new RegExp("OpenTok-Node-SDK\/"+package.version))
        .get('/v2/partner/' + apiKey + '/archive?')
          .reply(200, JSON.stringify({
            count: 1,
            items: [{
              id: '69c3f0c3-fca4-4dde-9087-b65f61a54f85',
              status: 'available',
              name: 'null',
              statusMessage: '',
              sessionId: '2_MX4xMDB-flR1ZSBOb3YgMTkgMTE6MDk6NTggUFNUIDIwMTN-MC4zNzQxNzIxNX4',
              partnerId: 100,
              createdAt: 1408488303000,
              size: 5251406,
              duration: 21,
              mode: 'automatic',
              updatedAt: 1408489354000,
              url: 'url'
            }]}),
        { server: 'nginx',
        date: 'Thu, 20 Mar 2014 14:17:22 GMT',
        'content-type': 'text/xml',
        connection: 'keep-alive',
        'access-control-allow-origin': '*',
        'x-tb-host': 'oms506-nyc.tokbox.com'});

      opentok.listArchives(function(err, archives, total) {
        expect(err).to.be.null;
        expect(total).to.be.greaterThan(0);
        expect(archives.length).not.to.be.undefined;
        expect(archives.length).to.be.greaterThan(0);
        done();
      });
    });

  });
});
