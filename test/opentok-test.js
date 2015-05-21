var expect = require('chai').expect,
    nock = require('nock'),
    _ = require('lodash');

// Subject
var OpenTok = require('../lib/opentok.js'),
    Session = require('../lib/session.js'),
    package = require('../package.json');

// Fixtures
var apiKey = '123456',
    apiSecret = '1234567890abcdef1234567890abcdef1234567890',
    apiUrl = 'http://mymock.example.com',
    // This is specifically concocted for these tests (uses fake apiKey/apiSecret above)
    sessionId = '1_MX4xMjM0NTZ-flNhdCBNYXIgMTUgMTQ6NDI6MjMgUERUIDIwMTR-MC40OTAxMzAyNX4',
    badApiKey = 'badkey',
    badApiSecret = 'badsecret',
    defaultApiUrl = 'https://api.opentok.com',
    defaultTimeoutLength = 20000; // 20 seconds
nock.disableNetConnect();

var recording = false;
if (recording) {
  // set these values before changing the above to true
  apiKey = '';
  apiSecret = '';
  //nock.enableNetConnect();
  nock.recorder.rec();
}

// Helpers
var helpers = require('./helpers.js');

describe('OpenTok', function() {
  it('should initialize with a valid apiKey and apiSecret', function() {
    var opentok = new OpenTok(apiKey, apiSecret);
    expect(opentok).to.be.an.instanceof(OpenTok);
    expect(opentok.apiKey).to.be.equal(apiKey);
    expect(opentok.apiSecret).to.be.equal(apiSecret);
    expect(opentok.apiUrl).to.be.equal(defaultApiUrl);
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

  describe('when initialized with an apiUrl', function() {
    beforeEach(function() {
      this.opentok = new OpenTok(apiKey, apiSecret, apiUrl);
    });
    it('exposes the custom apiUrl', function() {
      expect(this.opentok.apiUrl).to.be.equal(apiUrl);
    });
    it('sends its requests to the set apiUrl', function(done) {
       var scope = nock(apiUrl)
        .matchHeader('x-tb-partner-auth', apiKey+':'+apiSecret)
        .matchHeader('user-agent', new RegExp("OpenTok-Node-SDK\/"+package.version))
        .post('/session/create', "archiveMode=manual&p2p.preference=enabled")
        .reply(200, "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><sessions><Session><session_id>SESSIONID</session_id><partner_id>123456</partner_id><create_dt>Wed Mar 19 23:35:24 PDT 2014</create_dt></Session></sessions>", { server: 'nginx',
        date: 'Thu, 20 Mar 2014 06:35:24 GMT',
        'content-type': 'text/xml',
        connection: 'keep-alive',
        'access-control-allow-origin': '*',
        'x-tb-host': 'mantis503-nyc.tokbox.com',
        'content-length': '211' });
      this.opentok.createSession(function(err, session){
        if (err) return done(err);
        expect(session).to.be.an.instanceof(Session);
        expect(session.sessionId).to.equal('SESSIONID');
        scope.done();
        done(err);
      });
    });
  });

  describe('when initialized with a proxy', function() {
    beforeEach(function() {
      // TODO: remove temporary proxy value
      this.proxyUrl = 'http://localhost:8080';
      this.opentok = new OpenTok(apiKey, apiSecret, { proxy: this.proxyUrl });
    });
    it('sends its requests through an http proxy', function(done) {
      this.timeout(10000);
      var scope = nock('https://api.opentok.com:443')
        .post('/session/create', "archiveMode=manual&p2p.preference=enabled")
        .reply(200, "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><sessions><Session><session_id>1_MX44NTQ1MTF-flN1biBKdWwgMTMgMjE6MjY6MzUgUERUIDIwMTR-MC40OTU0NzA0Nn5Qfg</session_id><partner_id>854511</partner_id><create_dt>Sun Jul 13 21:26:35 PDT 2014</create_dt></Session></sessions>", { server: 'nginx',
        date: 'Mon, 14 Jul 2014 04:26:35 GMT',
        'content-type': 'application/xml',
        connection: 'keep-alive',
        'access-control-allow-origin': '*',
        'x-tb-host': 'mantis402-oak.tokbox.com',
        'content-length': '274' });
      this.opentok.createSession(function(err, session) {
        scope.done();
        done(err);
      });
    });
  });

  describe('when there is too much network latency', function() {
    beforeEach(function() {
      this.opentok = new OpenTok(apiKey, apiSecret);
    });
    it('times out when the request takes longer than the default timeout', function(done) {
      // make sure the mocha test runner doesn't time out for at least as long as we are willing to
      // wait plus some reasonable amount of overhead time (100ms)
      this.timeout(defaultTimeoutLength + 100);
      var scope = nock('https://api.opentok.com:443')
        .post('/session/create', "archiveMode=manual&p2p.preference=enabled")
        .delayConnection(defaultTimeoutLength + 10)
        .reply(200, "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><sessions><Session><session_id>1_MX44NTQ1MTF-flN1biBKdWwgMTMgMjE6MjY6MzUgUERUIDIwMTR-MC40OTU0NzA0Nn5Qfg</session_id><partner_id>854511</partner_id><create_dt>Sun Jul 13 21:26:35 PDT 2014</create_dt></Session></sessions>", { server: 'nginx',
        date: 'Mon, 14 Jul 2014 04:26:35 GMT',
        'content-type': 'application/xml',
        connection: 'keep-alive',
        'access-control-allow-origin': '*',
        'x-tb-host': 'mantis402-oak.tokbox.com',
        'content-length': '274' });
      this.opentok.createSession(function(err, session) {
        expect(err).to.be.an.instanceof(Error);
        scope.done();
        done();
      });
    });
  });

  describe('when initialized with bad credentials', function() {
    beforeEach(function() {
      this.opentok = new OpenTok(badApiKey, badApiSecret);
    });
    describe('#createSession', function() {
      it('throws a client error', function(done) {
        var scope = nock('https://api.opentok.com:443')
          .post('/session/create', "archiveMode=manual&p2p.preference=enabled")
          .reply(403, "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><errorPayload><code>-1</code><message>Invalid partner credentials</message></errorPayload>", { server: 'nginx',
          date: 'Fri, 30 May 2014 19:37:12 GMT',
          'content-type': 'application/xml',
          connection: 'keep-alive',
          'content-length': '145' });
        this.opentok.createSession(function(err, session) {
          expect(err).to.be.an.instanceof(Error);
          scope.done();
          done();
        });
      });
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
        .post('/session/create', "archiveMode=manual&p2p.preference=enabled")
        .reply(200, "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><sessions><Session><session_id>SESSIONID</session_id><partner_id>123456</partner_id><create_dt>Wed Mar 19 23:35:24 PDT 2014</create_dt></Session></sessions>", { server: 'nginx',
        date: 'Thu, 20 Mar 2014 06:35:24 GMT',
        'content-type': 'text/xml',
        connection: 'keep-alive',
        'access-control-allow-origin': '*',
        'x-tb-host': 'mantis503-nyc.tokbox.com',
        'content-length': '211' });
      // pass no options parameter
      this.opentok.createSession(function(err, session){
        if (err) return done(err);
        expect(session).to.be.an.instanceof(Session);
        expect(session.sessionId).to.equal('SESSIONID');
        expect(session.mediaMode).to.equal('relayed');
        scope.done();
        done(err);
      });
    });

    it('creates a media routed session', function(done) {
      var scope = nock('https://api.opentok.com:443')
        .matchHeader('x-tb-partner-auth', apiKey+':'+apiSecret)
        .matchHeader('user-agent', new RegExp("OpenTok-Node-SDK\/"+package.version))
        .post('/session/create', "archiveMode=manual&p2p.preference=disabled")
        .reply(200, "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><sessions><Session><session_id>SESSIONID</session_id><partner_id>123456</partner_id><create_dt>Thu Mar 20 07:02:45 PDT 2014</create_dt></Session></sessions>", { server: 'nginx',
        date: 'Thu, 20 Mar 2014 14:02:45 GMT',
        'content-type': 'text/xml',
        connection: 'keep-alive',
        'access-control-allow-origin': '*',
        'x-tb-host': 'oms506-nyc.tokbox.com',
        'content-length': '211' });
      this.opentok.createSession({ 'mediaMode' : 'routed' }, function(err, session) {
        if (err) return done(err);
        expect(session).to.be.an.instanceof(Session);
        expect(session.sessionId).to.equal('SESSIONID');
        expect(session.mediaMode).to.equal('routed');
        scope.done();
        done(err);
      });
    });

    it('creates a media relayed session even if the media mode is invalid', function(done) {
      var scope = nock('https://api.opentok.com:443')
        .matchHeader('x-tb-partner-auth', apiKey+':'+apiSecret)
        .matchHeader('user-agent', new RegExp("OpenTok-Node-SDK\/"+package.version))
        .post('/session/create', "archiveMode=manual&p2p.preference=enabled")
        .reply(200, "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><sessions><Session><session_id>SESSIONID</session_id><partner_id>123456</partner_id><create_dt>Thu Mar 20 07:02:45 PDT 2014</create_dt></Session></sessions>", { server: 'nginx',
        date: 'Thu, 20 Mar 2014 14:02:45 GMT',
        'content-type': 'text/xml',
        connection: 'keep-alive',
        'access-control-allow-origin': '*',
        'x-tb-host': 'oms506-nyc.tokbox.com',
        'content-length': '211' });
      this.opentok.createSession({ 'mediaMode' : 'blah' }, function(err, session) {
        if (err) return done(err);
        expect(session).to.be.an.instanceof(Session);
        expect(session.sessionId).to.equal('SESSIONID');
        expect(session.mediaMode).to.equal('relayed');
        scope.done();
        done(err);
      });
    });

    it('creates a session with manual archive mode', function(done) {
      var scope = nock('https://api.opentok.com:443')
        .matchHeader('x-tb-partner-auth', apiKey+':'+apiSecret)
        .matchHeader('user-agent', new RegExp("OpenTok-Node-SDK\/"+package.version))
        .post('/session/create', "archiveMode=manual&p2p.preference=disabled")
        .reply(200, "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><sessions><Session><session_id>SESSIONID</session_id><partner_id>123456</partner_id><create_dt>Thu Mar 20 07:02:45 PDT 2014</create_dt></Session></sessions>", { server: 'nginx',
        date: 'Thu, 20 Mar 2014 14:02:45 GMT',
        'content-type': 'text/xml',
        connection: 'keep-alive',
        'access-control-allow-origin': '*',
        'x-tb-host': 'oms506-nyc.tokbox.com',
        'content-length': '211' });
      this.opentok.createSession({ 'mediaMode' : 'routed', 'archiveMode' : 'manual' }, function(err, session) {
        if (err) return done(err);
        expect(session).to.be.an.instanceof(Session);
        expect(session.sessionId).to.equal('SESSIONID');
        expect(session.archiveMode).to.equal('manual');
        scope.done();
        done(err);
      });
    });

    it('creates a session with always archive mode', function(done) {
      var scope = nock('https://api.opentok.com:443')
        .matchHeader('x-tb-partner-auth', apiKey+':'+apiSecret)
        .matchHeader('user-agent', new RegExp("OpenTok-Node-SDK\/"+package.version))
        .post('/session/create', "archiveMode=always&p2p.preference=disabled")
        .reply(200, "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><sessions><Session><session_id>SESSIONID</session_id><partner_id>123456</partner_id><create_dt>Thu Mar 20 07:02:45 PDT 2014</create_dt></Session></sessions>", { server: 'nginx',
        date: 'Thu, 20 Mar 2014 14:02:45 GMT',
        'content-type': 'text/xml',
        connection: 'keep-alive',
        'access-control-allow-origin': '*',
        'x-tb-host': 'oms506-nyc.tokbox.com',
        'content-length': '211' });
      this.opentok.createSession({ 'mediaMode' : 'routed', 'archiveMode' : 'always' }, function(err, session) {
        if (err) return done(err);
        expect(session).to.be.an.instanceof(Session);
        expect(session.sessionId).to.equal('SESSIONID');
        expect(session.archiveMode).to.equal('always');
        scope.done();
        done(err);
      });
    });

    it('creates a session with manual archive mode even if the archive mode is invalid', function(done) {
      var scope = nock('https://api.opentok.com:443')
        .matchHeader('x-tb-partner-auth', apiKey+':'+apiSecret)
        .matchHeader('user-agent', new RegExp("OpenTok-Node-SDK\/"+package.version))
        .post('/session/create', "archiveMode=manual&p2p.preference=disabled")
        .reply(200, "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><sessions><Session><session_id>SESSIONID</session_id><partner_id>123456</partner_id><create_dt>Thu Mar 20 07:02:45 PDT 2014</create_dt></Session></sessions>", { server: 'nginx',
        date: 'Thu, 20 Mar 2014 14:02:45 GMT',
        'content-type': 'text/xml',
        connection: 'keep-alive',
        'access-control-allow-origin': '*',
        'x-tb-host': 'oms506-nyc.tokbox.com',
        'content-length': '211' });
      this.opentok.createSession({ 'mediaMode' : 'routed', 'archiveMode' : 'invalid' }, function(err, session) {
        if (err) return done(err);
        expect(session).to.be.an.instanceof(Session);
        expect(session.sessionId).to.equal('SESSIONID');
        expect(session.archiveMode).to.equal('manual');
        scope.done();
        done(err);
      });
    });

    it('adds a location hint to the created session', function(done) {
      var scope = nock('https://api.opentok.com:443')
        .matchHeader('x-tb-partner-auth', apiKey+':'+apiSecret)
        .matchHeader('user-agent', new RegExp("OpenTok-Node-SDK\/"+package.version))
        .post('/session/create', "location=12.34.56.78&archiveMode=manual&p2p.preference=enabled")
        .reply(200, "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><sessions><Session><session_id>SESSIONID</session_id><partner_id>123456</partner_id><create_dt>Thu Mar 20 07:17:22 PDT 2014</create_dt></Session></sessions>", { server: 'nginx',
        date: 'Thu, 20 Mar 2014 14:17:22 GMT',
        'content-type': 'text/xml',
        connection: 'keep-alive',
        'access-control-allow-origin': '*',
        'x-tb-host': 'oms506-nyc.tokbox.com',
        'content-length': '211' });
      // passes location: '12.34.56.78'
      this.opentok.createSession({ 'location': '12.34.56.78' }, function(err, session) {
        if (err) return done(err);
        expect(session).to.be.an.instanceof(Session);
        expect(session.sessionId).to.equal('SESSIONID');
        expect(session.mediaMode).to.equal('relayed');
        expect(session.location).to.equal('12.34.56.78');
        scope.done();
        done(err);
      });
    });

    it('complains when the location value is not valid', function(done) {
      this.opentok.createSession({ location: 'not an ip address' }, function(err) {
        expect(err).to.be.an.instanceof(Error);
        done();
      });
    });

    it('complains when the archive mode is always and the media mode is routed', function(done) {
      this.opentok.createSession({ archiveMedia: 'always', mediaMode: 'routed' }, function(err) {
        expect(err).to.be.an.instanceof(Error);
        done();
      });
    });

    it('complains when there is no callback function', function() {
      expect(function() {
        var result = this.opentok.createSession();
      }).to.throw(Error);
    });

    it('complains when a server error takes place', function(done) {
      var scope = nock('https://api.opentok.com:443')
        .matchHeader('x-tb-partner-auth', apiKey+':'+apiSecret)
        .matchHeader('user-agent', new RegExp("OpenTok-Node-SDK\/"+package.version))
        .post('/session/create', "archiveMode=manual&p2p.preference=enabled")
        .reply(503, "", { server: 'nginx',
        date: 'Thu, 20 Mar 2014 06:35:24 GMT',
        'content-type': 'text/xml',
        connection: 'keep-alive',
        'access-control-allow-origin': '*',
        'x-tb-host': 'mantis503-nyc.tokbox.com',
        'content-length': '0' });
      this.opentok.createSession(function(err, session) {
        expect(err).to.be.an.instanceof(Error);
        expect(err.message).to.contain("A server error occurred");
        scope.done();
        done();
      });
    });

    it('returns a Session that can generate a token', function(done) {
      var scope = nock('https://api.opentok.com:443')
        .matchHeader('x-tb-partner-auth', apiKey+':'+apiSecret)
        .matchHeader('user-agent', new RegExp("OpenTok-Node-SDK\/"+package.version))
        .post('/session/create', "archiveMode=manual&p2p.preference=enabled")
        .reply(200, "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><sessions><Session><session_id>"+sessionId+"</session_id><partner_id>123456</partner_id><create_dt>Wed Mar 19 23:35:24 PDT 2014</create_dt></Session></sessions>", { server: 'nginx',
        date: 'Thu, 20 Mar 2014 06:35:24 GMT',
        'content-type': 'text/xml',
        connection: 'keep-alive',
        'access-control-allow-origin': '*',
        'x-tb-host': 'mantis503-nyc.tokbox.com',
        'content-length': '211' });
      // pass no options parameter
      this.opentok.createSession(function(err, session){
        if (err) return done(err);
        scope.done();
        var token = session.generateToken();
        expect(token).to.be.a('string');
        done(err);
      });
    });

    it('should not modify the options object parameter', function(done) {
      var scope = nock('https://api.opentok.com:443')
        .filteringRequestBody(function(path) {
          return '*';
        })
        .post('/session/create', '*')
        .reply(200, "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><sessions><Session><session_id>SESSIONID</session_id><partner_id>123456</partner_id><create_dt>Thu Mar 20 07:02:45 PDT 2014</create_dt></Session></sessions>", { server: 'nginx',
        date: 'Thu, 20 Mar 2014 14:02:45 GMT',
        'content-type': 'text/xml',
        connection: 'keep-alive',
        'access-control-allow-origin': '*',
        'x-tb-host': 'oms506-nyc.tokbox.com',
        'content-length': '211' });
      var options = { mediaMode: 'routed', archiveMode: 'manual' };
      var optionsUntouched = _.clone(options);
      this.opentok.createSession(options, function(err, session) {
        if (err) return done(err);
        scope.done();
        expect(options).to.deep.equal(optionsUntouched);
        done();
      });
    });

  });


  describe('#generateToken', function() {

    beforeEach(function() {
      this.opentok = new OpenTok(apiKey, apiSecret);
      this.sessionId = sessionId;
    });

    it('generates a token', function() {
      // call generateToken with no options
      var token = this.opentok.generateToken(this.sessionId);
      expect(token).to.be.a('string');
      expect(helpers.verifyTokenSignature(token, apiSecret)).to.be.true
      var decoded = helpers.decodeToken(token);
      expect(decoded.partner_id).to.equal(apiKey);
      expect(decoded.create_time).to.exist
      expect(decoded.nonce).to.exist
    });

    it('assigns a role in the token', function() {
      // expects one with no role defined to assign "publisher"
      var defaultRoleToken = this.opentok.generateToken(this.sessionId);
      expect(defaultRoleToken).to.be.a('string');
      expect(helpers.verifyTokenSignature(defaultRoleToken, apiSecret)).to.be.true
      var decoded = helpers.decodeToken(defaultRoleToken);
      expect(decoded.role).to.equal('publisher');

      // expects one with a valid role defined to set it
      var subscriberToken = this.opentok.generateToken(this.sessionId, { role : 'subscriber' });
      expect(subscriberToken).to.be.a('string');
      expect(helpers.verifyTokenSignature(subscriberToken, apiSecret)).to.be.true
      decoded = helpers.decodeToken(subscriberToken);
      expect(decoded.role).to.equal('subscriber');

      // expects one with an invalid role to complain
      expect(function() {
        this.opentok.generateToken(this.sessionId, { role : 5 });
      }).to.throw(Error);
    });

    it('sets an expiration time for the token', function() {
      var now = Math.round((new Date().getTime()) / 1000);
      var delta = 10;
      var decoded;

      // expects a token with no expiration time to assign 1 day
      var inOneDay = now + (60*60*24);
      var defaultExpireToken = this.opentok.generateToken(this.sessionId);
      expect(defaultExpireToken).to.be.a('string');
      expect(helpers.verifyTokenSignature(defaultExpireToken, apiSecret)).to.be.true
      decoded = helpers.decodeToken(defaultExpireToken);
      expect(decoded.expire_time).to.be.within(inOneDay-delta, inOneDay+delta);

      // expects a token with an expiration time to have it
      var inOneHour = now + (60*60);
      var oneHourToken = this.opentok.generateToken(this.sessionId, { expireTime: inOneHour });
      expect(oneHourToken).to.be.a('string');
      expect(helpers.verifyTokenSignature(oneHourToken, apiSecret)).to.be.true
      decoded = helpers.decodeToken(oneHourToken);
      expect(decoded.expire_time).to.be.within(inOneHour-delta, inOneHour+delta);

      // expects a token with an invalid expiration time to complain
      expect(function() {
        this.opentok.generateToken(this.sessionId, { expireTime: "not a time" });
      }).to.throw(Error);

      var oneHourAgo = now - (60*60);
      expect(function() {
        this.opentok.generateToken(this.sessionId, { expireTime: oneHourAgo });
      }).to.throw(Error);

      // rounds down fractional expiration time
      var fractionalExpireTime = now + (60.5);
      var roundedToken = this.opentok.generateToken(this.sessionId, { expireTime: fractionalExpireTime });
      expect(helpers.verifyTokenSignature(roundedToken, apiSecret)).to.be.true
      decoded = helpers.decodeToken(roundedToken);
      expect(decoded.expire_time).to.equal(Math.round(fractionalExpireTime).toString());
    });

    it('sets connection data in the token', function() {
      // expects a token with a connection data to have it
      var sampleData = 'name=Johnny';
      var dataBearingToken = this.opentok.generateToken(this.sessionId, { data: sampleData });
      expect(dataBearingToken).to.be.a('string');
      expect(helpers.verifyTokenSignature(dataBearingToken, apiSecret)).to.be.true
      var decoded = helpers.decodeToken(dataBearingToken);
      expect(decoded.connection_data).to.equal(sampleData);

      // expects a token with invalid connection data to complain
      expect(function() {
        this.opentok.generateToken(this.sessionId, { data: { 'dont': 'work' } });
      }).to.throw(Error);

      expect(function() {
        this.opentok.generateToken(this.sessionId, {
          data: Array(2000).join("a") // 1999 char string of all 'a's
        });
      }).to.throw(Error);
    });

    it('complains if the sessionId is not valid', function() {
      expect(function() {
        this.opentok.generateToken();
      }).to.throw(Error);

      expect(function() {
        this.opentok.generateToken('blahblahblah');
      }).to.throw(Error);
    });

    it('contains a unique nonce', function() {
      // generate a few and show the nonce exists each time and that they are different
      var tokens = [
        this.opentok.generateToken(this.sessionId),
        this.opentok.generateToken(this.sessionId)
      ];
      var nonces = _.map(tokens, function(token) { return helpers.decodeToken(token).nonce; });
      expect(_.uniq(nonces)).to.have.length(nonces.length);
    });

    it('does not modify passed in options', function() {
      var options = { data: 'test' };
      var optionsUntouched = _.clone(options);
      this.opentok.generateToken(this.sessionId, options);
      expect(options).to.deep.equal(optionsUntouched);
    });
  });

});
