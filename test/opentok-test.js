/* */
var expect = require('chai').expect;
var nock = require('nock');
var _ = require('lodash');
var jwt = require('jsonwebtoken');

// Subject
var OpenTok = require('../lib/opentok.js');
var Session = require('../lib/session.js');
var SipInterconnect = require('../lib/sipInterconnect.js');
var pkg = require('../package.json');

// Fixtures
var apiKey = '123456';
var apiSecret = '1234567890abcdef1234567890abcdef1234567890';
var apiUrl = 'http://mymock.example.com';

// This is specifically concocted for these tests (uses fake apiKey/apiSecret above)
var sessionId = '1_MX4xMjM0NTZ-flNhdCBNYXIgMTUgMTQ6NDI6MjMgUERUIDIwMTR-MC40OTAxMzAyNX4';
var badApiKey = 'badkey';
var badApiSecret = 'badsecret';
var goodSipUri = 'sip:siptesturl@tokbox.com';
var badSipUri = 'siptesturl@tokbox.com';
var defaultApiUrl = 'https://api.opentok.com';
var defaultTimeoutLength = 20000; // 20 seconds
var recording = false;

// Helpers
var helpers = require('./helpers.js');

var validReply = JSON.stringify([
  {
    session_id: 'SESSIONID',
    project_id: apiKey,
    partner_id: apiKey,
    create_dt: 'Fri Nov 18 15:50:36 PST 2016',
    media_server_url: ''
  }
]);

var mockBroadcastObject = {
  id: 'fooId',
  sessionId: 'fooSessionId',
  projectId: 1234,
  createdAt: 1537477584724,
  updatedAt: 1537477584725,
  broadcastUrls: { hls: 'hlsUrl' },
  maxDuration: 7200,
  resolution: '1280x720',
  event: 'broadcast',
  status: 'stopped'
};

var mockListBroadcastsObject = {
  count: 1,
  items: [{
    id: 'fooId',
    sessionId: 'fooSessionId',
    projectId: 1234,
    createdAt: 1537477584724,
    updatedAt: 1537477584725,
    broadcastUrls: { hls: 'hlsUrl' },
    maxDuration: 7200,
    resolution: '1280x720',
    event: 'broadcast',
    status: 'stopped'
  }]
};

function validateBroadcastObject(broadcast, status) {
  expect(broadcast.id).to.equal('fooId');
  expect(broadcast.sessionId).to.equal('fooSessionId');
  expect(broadcast.projectId).to.equal(1234);
  expect(broadcast.createdAt).to.equal(1537477584724);
  expect(broadcast.updatedAt).to.equal(1537477584725);
  expect(broadcast.broadcastUrls.hls).to.equal('hlsUrl');
  expect(broadcast.maxDuration).to.equal(7200);
  expect(broadcast.resolution).to.equal('1280x720');
  expect(broadcast.status).to.equal(status || 'stopped');
  expect(typeof broadcast.stop).to.equal('function');
}

function validateListBroadcastsObject(broadcastListObject) {
  var broadcast;
  expect(broadcastListObject).to.be.an('array');
  broadcast = broadcastListObject[0];
  validateBroadcastObject(broadcast);
}

function validateTotalCount(totalCount) {
  expect(totalCount).to.be.a('number');
}

function mockStreamRequest(sessId, streamId, status) {
  var body;
  if (!status) {
    body = JSON.stringify({
      id: 'fooId',
      name: 'fooName',
      layoutClassList: ['fooClass'],
      videoType: 'screen'
    });
  }
  nock('https://api.opentok.com')
    .get('/v2/project/APIKEY/session/' + sessId + '/stream/' + streamId)
    .reply(status || 200, body);
}

function mockListStreamsRequest(sessId, status) {
  var body;
  if (!status) {
    body = JSON.stringify({
      count: 1,
      items: [
        {
          id: 'fooId',
          name: 'fooName',
          layoutClassList: ['fooClass'],
          videoType: 'screen'
        }
      ]
    });
  }
  nock('https://api.opentok.com')
    .get('/v2/project/123456/session/' + sessId + '/stream')
    .reply(status || 200, body);
}

function mockListBroadcastsRequest(query, status) {
  var body;
  if (status) {
    body = JSON.stringify({
      message: 'error message'
    });
  }
  else {
    body = JSON.stringify(mockListBroadcastsObject);
  }
  nock('https://api.opentok.com')
    .get('/v2/project/APIKEY/broadcast')
    .query(query)
    .reply(status || 200, body);
}

nock.disableNetConnect();

if (recording) {
  // set these values before changing the above to true
  apiKey = '';
  apiSecret = '';
  // nock.enableNetConnect();
  nock.recorder.rec();
}

describe('OpenTok', function () {
  it('should initialize with a valid apiKey and apiSecret', function () {
    var opentok = new OpenTok(apiKey, apiSecret);
    expect(opentok).to.be.an.instanceof(OpenTok);
    expect(opentok.apiKey).to.be.equal(apiKey);
    expect(opentok.apiSecret).to.be.equal(apiSecret);
    expect(opentok.apiUrl).to.be.equal(defaultApiUrl);
  });
  it('should initialize without `new`', function () {
    var opentok = OpenTok(apiKey, apiSecret);
    expect(opentok).to.be.an.instanceof(OpenTok);
  });
  it('should not initialize with just an apiKey but no apiSecret', function () {
    expect(function () {
      var opentok = new OpenTok(apiKey); // eslint-disable-line
    }).to.throw(Error);
  });
  it('should not initialize with incorrect type parameters', function () {
    expect(function () {
      var opentok = new OpenTok(new Date(), 'asdasdasdasdasd'); // eslint-disable-line
    }).to.throw(Error);
    expect(function () {
      opentok = new OpenTok(4, {}); // eslint-disable-line
    }).to.throw(Error);
  });
  it('should cooerce a number for the apiKey', function () {
    var opentok = new OpenTok(parseInt(apiKey, 10), apiSecret);
    expect(opentok).to.be.an.instanceof(OpenTok);
  });
});

describe('JWT token', function describeJwtToken() {
  it('should not be expired', function (done) {
    var opentok = new OpenTok(apiKey, apiSecret);
    var expiration;
    var now;
    try {
      expiration = jwt.verify(opentok.generateJwt(), apiSecret, { issuer: apiKey }).exp;
      now = Math.floor(Date.now() / 1000);
      expect(expiration).to.be.above(now);
      done();
    }
    catch (error) {
      done(error);
    }
  });
  it('should have the apiKey set as the issuer', function (done) {
    var opentok = new OpenTok(apiKey, apiSecret);
    var issuer;
    try {
      issuer = jwt.verify(opentok.generateJwt(), apiSecret, { issuer: apiKey }).iss;
      expect(issuer).to.be.equal(apiKey);
      done();
    }
    catch (error) {
      done(error);
    }
  });
  // decoding with a valid secret is implicitly covered in the above tests
  it('should not decode with an invalid secret', function () {
    var opentok = new OpenTok(apiKey, apiSecret);
    expect(function () {
      jwt.verify(opentok.generateJwt(), 'invalid_secret', { issuer: apiKey });
    }).to.throw(Error);
  });
});

describe('when initialized with an apiUrl', function () {
  beforeEach(function () {
    this.opentok = new OpenTok(apiKey, apiSecret, apiUrl);
  });
  it('exposes the custom apiUrl', function () {
    expect(this.opentok.apiUrl).to.be.equal(apiUrl);
  });
  it('sends its requests to the set apiUrl', function (done) {
    var scope = nock(apiUrl)
      .matchHeader('x-opentok-auth', function (value) {
        try {
          jwt.verify(value, apiSecret, { issuer: apiKey });
          return true;
        }
        catch (error) {
          done(error);
          return false;
        }
      })
      .matchHeader('user-agent', new RegExp('OpenTok-Node-SDK/' + pkg.version))
      .post('/session/create', 'archiveMode=manual&p2p.preference=enabled')
      .reply(
        200, validReply,
        {
          server: 'nginx',
          date: 'Thu, 20 Mar 2014 06:35:24 GMT',
          'content-type': 'application/json',
          connection: 'keep-alive',
          'access-control-allow-origin': '*',
          'strict-transport-security': 'max-age=31536000; includeSubdomains',
          'content-length': '204'
        }
      );
    this.opentok.createSession(function (err, session) {
      if (err) {
        done(err);
        return;
      }
      expect(session).to.be.an.instanceof(Session);
      expect(session.sessionId).to.equal('SESSIONID');
      scope.done();
      done(err);
    });
  });
});

describe('when initialized with a proxy', function () {
  beforeEach(function () {
    // TODO: remove temporary proxy value
    this.proxyUrl = 'http://localhost:8080';
    this.opentok = new OpenTok(apiKey, apiSecret, { proxy: this.proxyUrl });
  });
  it('sends its requests through an http proxy', function (done) {
    var scope;
    this.timeout(10000);
    scope = nock('https://api.opentok.com:443')
      .post('/session/create', 'archiveMode=manual&p2p.preference=enabled')
      .reply(
        200, validReply,
        {
          server: 'nginx',
          date: 'Mon, 14 Jul 2014 04:26:35 GMT',
          'content-type': 'application/json',
          connection: 'keep-alive',
          'access-control-allow-origin': '*',
          'x-tb-host': 'mantis402-oak.tokbox.com',
          'content-length': '274'
        }
      );
    this.opentok.createSession(function (err) {
      scope.done();
      done(err);
    });
  });
});

describe('when initialized with a timeout', function () {
  beforeEach(function () {
    this.opentok = new OpenTok(apiKey, apiSecret, { timeout: 100 });
  });
  it('sends its requests with a timeout', function () {
    expect(this.opentok.client.c.request.timeout).to.equal(100);
  });
});

describe('when initialized without a timeout', function () {
  beforeEach(function () {
    this.opentok = new OpenTok(apiKey, apiSecret);
  });
  it('sends its requests with 20000 timeout', function () {
    expect(this.opentok.client.c.request.timeout).to.equal(20000);
  });
});

describe('when a user agent addendum is needed', function () {
  beforeEach(function () {
    this.addendum = 'my-special-app';
    this.opentok = new OpenTok(apiKey, apiSecret, { uaAddendum: this.addendum });
  });
  it('appends the addendum in a create session request', function (done) {
    var scope = nock('https://api.opentok.com:443')
      .matchHeader('x-opentok-auth', function (value) {
        try {
          jwt.verify(value, apiSecret, { issuer: apiKey });
          return true;
        }
        catch (error) {
          done(error);
          return false;
        }
      })
      .matchHeader('user-agent', new RegExp('OpenTok-Node-SDK/' + pkg.version))
      .post('/session/create', 'archiveMode=manual&p2p.preference=enabled')
      .reply(
        200, validReply,
        {
          server: 'nginx',
          date: 'Thu, 20 Mar 2014 06:35:24 GMT',
          'content-type': 'application/json',
          connection: 'keep-alive',
          'access-control-allow-origin': '*',
          'strict-transport-security': 'max-age=31536000; includeSubdomains',
          'content-length': '204'
        }
      );
    this.opentok.createSession(function (err) {
      if (err) {
        done(err);
        return;
      }
      scope.done();
      done(err);
    });
  });
  it.skip('appends the addendum in an archiving request', function () {
    // TODO:
  });
});

describe.skip('when there is too much network latency', function () {
  beforeEach(function () {
    this.opentok = new OpenTok(apiKey, apiSecret);
  });
  it('times out when the request takes longer than the default timeout', function (done) {
    // make sure the mocha test runner doesn't time out for at least as long as we are willing to
    // wait plus some reasonable amount of overhead time (100ms)
    var scope;
    this.timeout(defaultTimeoutLength + 100);
    scope = nock('https://api.opentok.com:443')
      .post('/session/create', 'archiveMode=manual&p2p.preference=enabled')
      .delayConnection(defaultTimeoutLength + 10)
      .reply(
        200, validReply,
        {
          server: 'nginx',
          date: 'Mon, 14 Jul 2014 04:26:35 GMT',
          'content-type': 'application/json',
          connection: 'keep-alive',
          'access-control-allow-origin': '*',
          'x-tb-host': 'mantis402-oak.tokbox.com',
          'content-length': '274'
        }
      );
    this.opentok.createSession(function (err) {
      expect(err).to.be.an.instanceof(Error);
      scope.done();
      done();
    });
  });
});

describe('when initialized with bad credentials', function () {
  beforeEach(function () {
    this.opentok = new OpenTok(badApiKey, badApiSecret);
  });
  describe('#createSession', function () {
    it('throws a client error', function (done) {
      var scope = nock('https://api.opentok.com:443')
        .post('/session/create', 'archiveMode=manual&p2p.preference=enabled')
        .reply(
          403, JSON.stringify({ code: -1, message: 'No suitable authentication found' }),
          {
            server: 'nginx',
            date: 'Fri, 30 May 2014 19:37:12 GMT',
            'content-type': 'application/json',
            connection: 'keep-alive',
            'content-length': '56'
          }
        );
      this.opentok.createSession(function (err) {
        expect(err).to.be.an.instanceof(Error);
        scope.done();
        done();
      });
    });
  });
});

describe('#createSession', function () {
  beforeEach(function () {
    this.opentok = new OpenTok(apiKey, apiSecret);
  });

  it('creates a new session', function (done) {
    var scope = nock('https://api.opentok.com:443')
      .matchHeader('x-opentok-auth', function (value) {
        try {
          jwt.verify(value, apiSecret, { issuer: apiKey });
          return true;
        }
        catch (error) {
          done(error);
          return false;
        }
      })
      .matchHeader('user-agent', new RegExp('OpenTok-Node-SDK/' + pkg.version))
      .post('/session/create', 'archiveMode=manual&p2p.preference=enabled')
      .reply(
        200, validReply,
        {
          server: 'nginx',
          date: 'Thu, 20 Mar 2014 06:35:24 GMT',
          'content-type': 'application/json',
          connection: 'keep-alive',
          'access-control-allow-origin': '*',
          'strict-transport-security': 'max-age=31536000; includeSubdomains',
          'content-length': '204'
        }
      );
    // pass no options parameter
    this.opentok.createSession(function (err, session) {
      if (err) {
        done(err);
        return;
      }
      expect(session).to.be.an.instanceof(Session);
      expect(session.sessionId).to.equal('SESSIONID');
      expect(session.mediaMode).to.equal('relayed');
      scope.done();
      done();
    });
  });

  it('creates a media routed session', function (done) {
    var scope = nock('https://api.opentok.com:443')
      .matchHeader('x-opentok-auth', function (value) {
        try {
          jwt.verify(value, apiSecret, { issuer: apiKey });
          return true;
        }
        catch (error) {
          done(error);
          return false;
        }
      })
      .matchHeader('user-agent', new RegExp('OpenTok-Node-SDK/' + pkg.version))
      .post('/session/create', 'archiveMode=manual&p2p.preference=disabled')
      .reply(
        200, validReply,
        {
          server: 'nginx',
          date: 'Thu, 20 Mar 2014 06:35:24 GMT',
          'content-type': 'application/json',
          connection: 'keep-alive',
          'access-control-allow-origin': '*',
          'strict-transport-security': 'max-age=31536000; includeSubdomains',
          'content-length': '204'
        }
      );
    this.opentok.createSession({ mediaMode: 'routed' }, function (err, session) {
      if (err) {
        done(err);
        return;
      }
      expect(session).to.be.an.instanceof(Session);
      expect(session.sessionId).to.equal('SESSIONID');
      expect(session.mediaMode).to.equal('routed');
      scope.done();
      done(err);
    });
  });

  it('creates a media relayed session even if the media mode is invalid', function (done) {
    var scope = nock('https://api.opentok.com:443')
      .matchHeader('x-opentok-auth', function (value) {
        try {
          jwt.verify(value, apiSecret, { issuer: apiKey });
          return true;
        }
        catch (error) {
          done(error);
          return false;
        }
      })
      .matchHeader('user-agent', new RegExp('OpenTok-Node-SDK/' + pkg.version))
      .post('/session/create', 'archiveMode=manual&p2p.preference=enabled')
      .reply(
        200, validReply,
        {
          server: 'nginx',
          date: 'Thu, 20 Mar 2014 06:35:24 GMT',
          'content-type': 'application/json',
          connection: 'keep-alive',
          'access-control-allow-origin': '*',
          'strict-transport-security': 'max-age=31536000; includeSubdomains',
          'content-length': '204'
        }
      );
    this.opentok.createSession({ mediaMode: 'blah' }, function (err, session) {
      if (err) {
        done(err);
        return;
      }
      expect(session).to.be.an.instanceof(Session);
      expect(session.sessionId).to.equal('SESSIONID');
      expect(session.mediaMode).to.equal('relayed');
      scope.done();
      done(err);
    });
  });

  it('creates a session with manual archive mode', function (done) {
    var scope = nock('https://api.opentok.com:443')
      .matchHeader('x-opentok-auth', function (value) {
        try {
          jwt.verify(value, apiSecret, { issuer: apiKey });
          return true;
        }
        catch (error) {
          done(error);
          return false;
        }
      })
      .matchHeader('user-agent', new RegExp('OpenTok-Node-SDK/' + pkg.version))
      .post('/session/create', 'archiveMode=manual&p2p.preference=disabled')
      .reply(
        200, validReply,
        {
          server: 'nginx',
          date: 'Thu, 20 Mar 2014 06:35:24 GMT',
          'content-type': 'application/json',
          connection: 'keep-alive',
          'access-control-allow-origin': '*',
          'strict-transport-security': 'max-age=31536000; includeSubdomains',
          'content-length': '204'
        }
      );
    this.opentok.createSession({ mediaMode: 'routed', archiveMode: 'manual' }, function (err, session) {
      if (err) {
        done(err);
        return;
      }
      expect(session).to.be.an.instanceof(Session);
      expect(session.sessionId).to.equal('SESSIONID');
      expect(session.archiveMode).to.equal('manual');
      scope.done();
      done(err);
    });
  });

  it('creates a session with always archive mode', function (done) {
    var scope = nock('https://api.opentok.com:443')
      .matchHeader('x-opentok-auth', function (value) {
        try {
          jwt.verify(value, apiSecret, { issuer: apiKey });
          return true;
        }
        catch (error) {
          done(error);
          return false;
        }
      })
      .matchHeader('user-agent', new RegExp('OpenTok-Node-SDK/' + pkg.version))
      .post('/session/create', 'archiveMode=always&p2p.preference=disabled')
      .reply(
        200, validReply,
        {
          server: 'nginx',
          date: 'Thu, 20 Mar 2014 06:35:24 GMT',
          'content-type': 'application/json',
          connection: 'keep-alive',
          'access-control-allow-origin': '*',
          'strict-transport-security': 'max-age=31536000; includeSubdomains',
          'content-length': '204'
        }
      );
    this.opentok.createSession({ mediaMode: 'routed', archiveMode: 'always' }, function (err, session) {
      if (err) {
        done(err);
        return;
      }
      expect(session).to.be.an.instanceof(Session);
      expect(session.sessionId).to.equal('SESSIONID');
      expect(session.archiveMode).to.equal('always');
      scope.done();
      done(err);
    });
  });

  it('creates a session with manual archive mode even if the archive mode is invalid', function (done) {
    var scope = nock('https://api.opentok.com:443')
      .matchHeader('x-opentok-auth', function (value) {
        try {
          jwt.verify(value, apiSecret, { issuer: apiKey });
          return true;
        }
        catch (error) {
          done(error);
          return false;
        }
      })
      .matchHeader('user-agent', new RegExp('OpenTok-Node-SDK/' + pkg.version))
      .post('/session/create', 'archiveMode=manual&p2p.preference=disabled')
      .reply(
        200, validReply,
        {
          server: 'nginx',
          date: 'Thu, 20 Mar 2014 06:35:24 GMT',
          'content-type': 'application/json',
          connection: 'keep-alive',
          'access-control-allow-origin': '*',
          'strict-transport-security': 'max-age=31536000; includeSubdomains',
          'content-length': '204'
        }
      );
    this.opentok.createSession({ mediaMode: 'routed', archiveMode: 'invalid' }, function (err, session) {
      if (err) {
        done(err);
        return;
      }
      expect(session).to.be.an.instanceof(Session);
      expect(session.sessionId).to.equal('SESSIONID');
      expect(session.archiveMode).to.equal('manual');
      scope.done();
      done(err);
    });
  });

  it('adds a location hint to the created session', function (done) {
    var scope = nock('https://api.opentok.com:443')
      .matchHeader('x-opentok-auth', function (value) {
        try {
          jwt.verify(value, apiSecret, { issuer: apiKey });
          return true;
        }
        catch (error) {
          done(error);
          return false;
        }
      })
      .matchHeader('user-agent', new RegExp('OpenTok-Node-SDK/' + pkg.version))
      .post('/session/create', 'location=12.34.56.78&archiveMode=manual&p2p.preference=enabled')
      .reply(
        200, validReply,
        {
          server: 'nginx',
          date: 'Thu, 20 Mar 2014 06:35:24 GMT',
          'content-type': 'application/json',
          connection: 'keep-alive',
          'access-control-allow-origin': '*',
          'strict-transport-security': 'max-age=31536000; includeSubdomains',
          'content-length': '204'
        }
      );
    // passes location: '12.34.56.78'
    this.opentok.createSession({ location: '12.34.56.78' }, function (err, session) {
      if (err) {
        done(err);
        return;
      }
      expect(session).to.be.an.instanceof(Session);
      expect(session.sessionId).to.equal('SESSIONID');
      expect(session.mediaMode).to.equal('relayed');
      expect(session.location).to.equal('12.34.56.78');
      scope.done();
      done(err);
    });
  });

  it('complains when the location value is not valid', function (done) {
    this.opentok.createSession({ location: 'not an ip address' }, function (err) {
      expect(err).to.be.an.instanceof(Error);
      done();
    });
  });

  it('complains when the archive mode is always and the media mode is routed', function (done) {
    this.opentok.createSession({ archiveMedia: 'always', mediaMode: 'routed' }, function (err) {
      expect(err).to.be.an.instanceof(Error);
      done();
    });
  });

  it('complains when there is no callback function', function () {
    expect(function () {
      this.opentok.createSession();
    }).to.throw(Error);
  });

  it('complains when a server error takes place', function (done) {
    var scope = nock('https://api.opentok.com:443')
      .matchHeader('x-opentok-auth', function (value) {
        try {
          jwt.verify(value, apiSecret, { issuer: apiKey });
          return true;
        }
        catch (error) {
          done(error);
          return false;
        }
      })
      .matchHeader('user-agent', new RegExp('OpenTok-Node-SDK/' + pkg.version))
      .post('/session/create', 'archiveMode=manual&p2p.preference=enabled')
      .reply(503, '', {
        server: 'nginx',
        date: 'Thu, 20 Mar 2014 06:35:24 GMT',
        'content-type': 'text/xml',
        connection: 'keep-alive',
        'access-control-allow-origin': '*',
        'x-tb-host': 'mantis503-nyc.tokbox.com',
        'content-length': '0'
      });
    this.opentok.createSession(function (err) {
      expect(err).to.be.an.instanceof(Error);
      expect(err.message).to.contain('A server error occurred');
      scope.done();
      done();
    });
  });

  it('returns a Session that can generate a token', function (done) {
    var scope = nock('https://api.opentok.com:443')
      .matchHeader('x-opentok-auth', function (value) {
        try {
          jwt.verify(value, apiSecret, { issuer: apiKey });
          return true;
        }
        catch (error) {
          done(error);
          return false;
        }
      })
      .matchHeader('user-agent', new RegExp('OpenTok-Node-SDK/' + pkg.version))
      .post('/session/create', 'archiveMode=manual&p2p.preference=enabled')
      .reply(
        200, '[{"session_id":"' + sessionId + '","project_id":"' + apiKey + '","partner_id":"' + apiKey + '","create_dt":"Fri Nov 18 15:50:36 PST 2016","media_server_url":""}]',
        {
          server: 'nginx',
          date: 'Thu, 20 Mar 2014 06:35:24 GMT',
          'content-type': 'application/json',
          connection: 'keep-alive',
          'access-control-allow-origin': '*',
          'strict-transport-security': 'max-age=31536000; includeSubdomains',
          'content-length': '204'
        }
      );
    // pass no options parameter
    this.opentok.createSession(function (err, session) {
      var token;
      if (err) {
        done(err);
        return;
      }
      scope.done();
      token = session.generateToken();
      expect(token).to.be.a('string');
      done(err);
    });
  });

  it('should not modify the options object parameter', function (done) {
    var scope = nock('https://api.opentok.com:443')
      .filteringRequestBody(function () {
        return '*';
      })
      .post('/session/create', '*')
      .reply(
        200, validReply,
        {
          server: 'nginx',
          date: 'Thu, 20 Mar 2014 14:02:45 GMT',
          'content-type': 'text/xml',
          connection: 'keep-alive',
          'access-control-allow-origin': '*',
          'x-tb-host': 'oms506-nyc.tokbox.com',
          'content-length': '211'
        }
      );
    var options = { mediaMode: 'routed', archiveMode: 'manual' };
    var optionsUntouched = _.clone(options);
    this.opentok.createSession(options, function (err) {
      if (err) {
        done(err);
        return;
      }
      scope.done();
      expect(options).to.deep.equal(optionsUntouched);
      done();
    });
  });
});


describe('#generateToken', function () {
  beforeEach(function () {
    this.opentok = new OpenTok(apiKey, apiSecret);
    this.sessionId = sessionId;
  });

  it('given a valid session, generates a token', function () {
    // call generateToken with no options
    var token = this.opentok.generateToken(this.sessionId);
    var decoded;
    expect(token).to.be.a('string');
    expect(helpers.verifyTokenSignature(token, apiSecret)).to.be.true;
    decoded = helpers.decodeToken(token);
    expect(decoded.partner_id).to.equal(apiKey);
    expect(decoded.create_time).to.exist;
    expect(decoded.nonce).to.exist;
  });

  it('assigns a role in the token', function () {
    // expects one with no role defined to assign "publisher"
    var defaultRoleToken = this.opentok.generateToken(this.sessionId);
    var decoded;
    var subscriberToken;
    expect(defaultRoleToken).to.be.a('string');
    expect(helpers.verifyTokenSignature(defaultRoleToken, apiSecret)).to.be.true;
    decoded = helpers.decodeToken(defaultRoleToken);
    expect(decoded.role).to.equal('publisher');

    // expects one with a valid role defined to set it
    subscriberToken = this.opentok.generateToken(this.sessionId, { role: 'subscriber' });
    expect(subscriberToken).to.be.a('string');
    expect(helpers.verifyTokenSignature(subscriberToken, apiSecret)).to.be.true;
    decoded = helpers.decodeToken(subscriberToken);
    expect(decoded.role).to.equal('subscriber');

    // expects one with an invalid role to complain
    expect(function () {
      this.opentok.generateToken(this.sessionId, { role: 5 });
    }).to.throw(Error);
  });

  it('sets an expiration time for the token', function () {
    var now = Math.round((new Date().getTime()) / 1000);
    var delta = 10;
    var decoded;
    var expireTime;

    // expects a token with no expiration time to assign 1 day
    var inOneDay = now + (60 * 60 * 24);
    var defaultExpireToken = this.opentok.generateToken(this.sessionId);
    var oneHourToken;
    var inOneHour;
    var oneHourAgo;

    var fractionalExpireTime;
    var roundedToken;

    expect(defaultExpireToken).to.be.a('string');
    expect(helpers.verifyTokenSignature(defaultExpireToken, apiSecret)).to.be.true;
    decoded = helpers.decodeToken(defaultExpireToken);
    expireTime = parseInt(decoded.expire_time, 10);
    expect(expireTime).to.be.closeTo(inOneDay, delta);

    // expects a token with an expiration time to have it
    inOneHour = now + (60 * 60);
    oneHourToken = this.opentok.generateToken(this.sessionId, { expireTime: inOneHour });
    expect(oneHourToken).to.be.a('string');
    expect(helpers.verifyTokenSignature(oneHourToken, apiSecret)).to.be.true;
    decoded = helpers.decodeToken(oneHourToken);
    expireTime = parseInt(decoded.expire_time, 10);
    expect(expireTime).to.be.closeTo(inOneHour, delta);

    // expects a token with an invalid expiration time to complain
    expect(function () {
      this.opentok.generateToken(this.sessionId, { expireTime: 'not a time' });
    }).to.throw(Error);

    oneHourAgo = now - (60 * 60);
    expect(function () {
      this.opentok.generateToken(this.sessionId, { expireTime: oneHourAgo });
    }).to.throw(Error);

    // rounds down fractional expiration time
    fractionalExpireTime = now + (60.5);
    roundedToken = this.opentok.generateToken(this.sessionId, { expireTime: fractionalExpireTime });
    expect(helpers.verifyTokenSignature(roundedToken, apiSecret)).to.be.true;
    decoded = helpers.decodeToken(roundedToken);
    expect(decoded.expire_time).to.equal(Math.round(fractionalExpireTime).toString());
  });

  it('sets initial layout class list in the token', function () {
    var layoutClassList = ['focus', 'inactive'];
    var singleLayoutClass = 'focus';
    var layoutBearingToken = this.opentok.generateToken(this.sessionId, {
      initialLayoutClassList: layoutClassList
    });
    var decoded = helpers.decodeToken(layoutBearingToken);
    var singleLayoutBearingToken = this.opentok.generateToken(this.sessionId, {
      initialLayoutClassList: singleLayoutClass
    });

    expect(layoutBearingToken).to.be.a('string');
    expect(helpers.verifyTokenSignature(layoutBearingToken, apiSecret)).to.be.true;
    expect(decoded.initial_layout_class_list).to.equal(layoutClassList.join(' '));
    expect(singleLayoutBearingToken).to.be.a('string');
    expect(helpers.verifyTokenSignature(singleLayoutBearingToken, apiSecret)).to.be.true;
    decoded = helpers.decodeToken(singleLayoutBearingToken);
    expect(decoded.initial_layout_class_list).to.equal(singleLayoutClass);

    // NOTE: ignores invalid options instead of throwing an error, except if its too long
  });

  it('complains if the sessionId is not valid', function () {
    expect(function () {
      this.opentok.generateToken();
    }).to.throw(Error);
  });

  it('sets connection data in the token', function () {
    // expects a token with a connection data to have it
    var sampleData = 'name=Johnny';
    var decoded;
    var dataBearingToken = this.opentok.generateToken(this.sessionId, { data: sampleData });
    expect(dataBearingToken).to.be.a('string');
    expect(helpers.verifyTokenSignature(dataBearingToken, apiSecret)).to.be.true;
    decoded = helpers.decodeToken(dataBearingToken);
    expect(decoded.connection_data).to.equal(sampleData);

    // expects a token with invalid connection data to complain
    expect(function () {
      this.opentok.generateToken(this.sessionId, { data: { dont: 'work' } });
    }).to.throw(Error);

    expect(function () {
      this.opentok.generateToken(this.sessionId, {
        data: Array(2000).join('a') // 1999 char string of all 'a's
      });
    }).to.throw(Error);
  });

  it('complains if the sessionId is not valid', function () {
    expect(function () {
      this.opentok.generateToken();
    }).to.throw(Error);

    expect(function () {
      this.opentok.generateToken('blahblahblah');
    }).to.throw(Error);
  });

  it('contains a unique nonce', function () {
    // generate a few and show the nonce exists each time and that they are different
    var tokens = [
      this.opentok.generateToken(this.sessionId),
      this.opentok.generateToken(this.sessionId)
    ];
    var nonces = _.map(tokens, function (token) { return helpers.decodeToken(token).nonce; });
    expect(_.uniq(nonces)).to.have.length(nonces.length);
  });

  it('does not modify passed in options', function () {
    var options = { data: 'test' };
    var optionsUntouched = _.clone(options);
    this.opentok.generateToken(this.sessionId, options);
    expect(options).to.deep.equal(optionsUntouched);
  });
});

describe('#dial', function () {
  beforeEach(function () {
    this.opentok = new OpenTok(apiKey, apiSecret);
    this.sessionId = sessionId;
    this.token = this.opentok.generateToken(this.sessionId);
  });

  it('dials a SIP gateway and adds a stream', function (done) {
    var scope = nock('https://api.opentok.com:443')
      .matchHeader('x-opentok-auth', function (value) {
        try {
          jwt.verify(value, apiSecret, { issuer: apiKey });
          return true;
        }
        catch (error) {
          done(error);
          return false;
        }
      })
      .matchHeader('user-agent', new RegExp('OpenTok-Node-SDK/' + pkg.version))
      .post('/v2/project/123456/dial', {
        sessionId: this.sessionId,
        token: this.token,
        sip: {
          uri: goodSipUri
        }
      })
      .reply(200, {
        id: 'CONFERENCEID',
        connectionId: 'CONNECTIONID',
        streamId: 'STREAMID'
      });
    this.opentok.dial(this.sessionId, this.token, goodSipUri, function (err, sipCall) {
      if (err) {
        done(err);
        return;
      }
      expect(sipCall).to.be.an.instanceof(SipInterconnect);
      expect(sipCall.id).to.equal('CONFERENCEID');
      expect(sipCall.streamId).to.equal('STREAMID');
      expect(sipCall.connectionId).to.equal('CONNECTIONID');
      scope.done();
      done(err);
    });
  });

  it('dials a SIP gateway and adds a stream with custom headers', function (done) {
    var scope = nock('https://api.opentok.com:443')
      .matchHeader('x-opentok-auth', function (value) {
        try {
          jwt.verify(value, apiSecret, { issuer: apiKey });
          return true;
        }
        catch (error) {
          done(error);
          return false;
        }
      })
      .matchHeader('user-agent', new RegExp('OpenTok-Node-SDK/' + pkg.version))
      .post('/v2/project/123456/dial', {
        sessionId: this.sessionId,
        token: this.token,
        sip: {
          uri: goodSipUri,
          headers: {
            someKey: 'someValue'
          }
        }
      })
      .reply(200, {
        id: 'CONFERENCEID',
        connectionId: 'CONNECTIONID',
        streamId: 'STREAMID'
      });
    this.opentok.dial(
      this.sessionId, this.token, goodSipUri, { headers: { someKey: 'someValue' } },
      function (err, sipCall) {
        if (err) {
          done(err);
          return;
        }
        expect(sipCall).to.be.an.instanceof(SipInterconnect);
        expect(sipCall.id).to.equal('CONFERENCEID');
        expect(sipCall.streamId).to.equal('STREAMID');
        expect(sipCall.connectionId).to.equal('CONNECTIONID');
        scope.done();
        done(err);
      }
    );
  });

  it('dials a SIP gateway and adds a stream with authentication', function (done) {
    var scope = nock('https://api.opentok.com:443')
      .matchHeader('x-opentok-auth', function (value) {
        try {
          jwt.verify(value, apiSecret, { issuer: apiKey });
          return true;
        }
        catch (error) {
          done(error);
          return false;
        }
      })
      .matchHeader('user-agent', new RegExp('OpenTok-Node-SDK/' + pkg.version))
      .post('/v2/project/123456/dial', {
        sessionId: this.sessionId,
        token: this.token,
        sip: {
          uri: goodSipUri,
          auth: {
            username: 'someUsername',
            password: 'somePassword'
          }
        }
      })
      .reply(200, {
        id: 'CONFERENCEID',
        connectionId: 'CONNECTIONID',
        streamId: 'STREAMID'
      });
    this.opentok.dial(
      this.sessionId, this.token, goodSipUri, {
        auth: { username: 'someUsername', password: 'somePassword' }
      },
      function (err, sipCall) {
        if (err) {
          done(err);
          return;
        }
        expect(sipCall).to.be.an.instanceof(SipInterconnect);
        expect(sipCall.id).to.equal('CONFERENCEID');
        expect(sipCall.streamId).to.equal('STREAMID');
        expect(sipCall.connectionId).to.equal('CONNECTIONID');
        scope.done();
        done(err);
      }
    );
  });

  it('dials a SIP gateway and adds an encrypted media stream', function (done) {
    var scope = nock('https://api.opentok.com:443')
      .matchHeader('x-opentok-auth', function (value) {
        try {
          jwt.verify(value, apiSecret, { issuer: apiKey });
          return true;
        }
        catch (error) {
          done(error);
          return false;
        }
      })
      .matchHeader('user-agent', new RegExp('OpenTok-Node-SDK/' + pkg.version))
      .post('/v2/project/123456/dial', {
        sessionId: this.sessionId,
        token: this.token,
        sip: {
          uri: goodSipUri,
          secure: true
        }
      })
      .reply(200, {
        id: 'CONFERENCEID',
        connectionId: 'CONNECTIONID',
        streamId: 'STREAMID'
      });
    this.opentok.dial(
      this.sessionId, this.token, goodSipUri, { secure: true },
      function (err, sipCall) {
        if (err) {
          done(err);
          return;
        }
        expect(sipCall).to.be.an.instanceof(SipInterconnect);
        expect(sipCall.id).to.equal('CONFERENCEID');
        expect(sipCall.streamId).to.equal('STREAMID');
        expect(sipCall.connectionId).to.equal('CONNECTIONID');
        scope.done();
        done(err);
      }
    );
  });

  it('dials a SIP gateway and adds a from field', function (done) {
    var scope = nock('https://api.opentok.com:443')
      .matchHeader('x-opentok-auth', function (value) {
        try {
          jwt.verify(value, apiSecret, { issuer: apiKey });
          return true;
        }
        catch (error) {
          done(error);
          return false;
        }
      })
      .matchHeader('user-agent', new RegExp('OpenTok-Node-SDK/' + pkg.version))
      .post('/v2/project/123456/dial', {
        sessionId: this.sessionId,
        token: this.token,
        sip: {
          uri: goodSipUri,
          from: '15551115555'
        }
      })
      .reply(200, {
        id: 'CONFERENCEID',
        connectionId: 'CONNECTIONID',
        streamId: 'STREAMID'
      });
    this.opentok.dial(
      this.sessionId, this.token, goodSipUri, { from: '15551115555' },
      function (err, sipCall) {
        if (err) {
          done(err);
          return;
        }
        expect(sipCall).to.be.an.instanceof(SipInterconnect);
        expect(sipCall.id).to.equal('CONFERENCEID');
        expect(sipCall.streamId).to.equal('STREAMID');
        expect(sipCall.connectionId).to.equal('CONNECTIONID');
        scope.done();
        done();
      }
    );
  });

  it('complains if sessionId, token, SIP URI, or callback are missing or invalid', function () {
    // Missing all params
    expect(function () {
      this.opentok.dial();
    }).to.throw(Error);
    // Bad sessionId
    expect(function () {
      this.opentok.dial('blahblahblah');
    }).to.throw(Error);
    // Missing token
    expect(function () {
      this.opentok.dial(this.sessionId);
    }).to.throw(Error);
    // Bad token
    expect(function () {
      this.opentok.dial(this.sessionId, 'blahblahblah');
    }).to.throw(Error);
    // Missing SIP URI
    expect(function () {
      this.opentok.dial(this.sessionId, this.token);
    }).to.throw(Error);
    // Bad SIP URI
    expect(function () {
      this.opentok.dial(this.sessionId, this.token, badSipUri);
    }).to.throw(Error);
    // Bad sessionId, working token and SIP URI
    expect(function () {
      this.opentok.dial('someWrongSessionId', this.token, goodSipUri);
    }).to.throw(Error);
    // Good sessionId, bad token and good SIP URI
    expect(function () {
      this.opentok.dial(this.sessionId, 'blahblahblah', goodSipUri);
    }).to.throw(Error);
    // Good sessionId, good token, good SIP URI, null options, missing callback func
    expect(function () {
      this.opentok.dial(this.sessionId, this.token, goodSipUri, null);
    }).to.throw(Error);
  });

  it('does not modify passed in options', function () {
    var options = { data: 'test' };
    var optionsUntouched = _.clone(options);
    this.opentok.dial(
      this.sessionId, this.token, 'sip:testsipuri@tokbox.com', options,
      function () {
        expect(options).to.deep.equal(optionsUntouched);
      }
    );
  });
});

describe('#startBroadcast', function () {
  var opentok = new OpenTok('APIKEY', 'APISECRET');
  var SESSIONID = '1_MX4xMDB-MTI3LjAuMC4xflR1ZSBKYW4gMjggMTU6NDg6NDAgUFNUIDIwMTR-MC43NjAyOTYyfg';
  var options = {
    outputs: {
      hls: { }
    }
  };

  function mockStartBroadcastRequest(sessId, status) {
    var body;
    var broadcastObj;
    if (!status) {
      broadcastObj = _.clone(mockBroadcastObject);
      broadcastObj.status = 'started';
      body = JSON.stringify(broadcastObj);
    }
    nock('https://api.opentok.com')
      .post('/v2/project/APIKEY/broadcast')
      .reply(status || 200, body);
  }

  afterEach(function () {
    nock.cleanAll();
  });

  it('succeeds given valid parameters', function (done) {
    mockStartBroadcastRequest(SESSIONID);
    opentok.startBroadcast(SESSIONID, options, function (err, broadcast) {
      validateBroadcastObject(broadcast, 'started');
      done();
    });
  });

  it('results in error if no callback method provided', function (done) {
    mockStartBroadcastRequest(SESSIONID);
    try {
      opentok.startBroadcast(SESSIONID, {});
    }
    catch (err) {
      expect(err.message).to.equal('No callback given to startBroadcast');
      done();
    }
  });

  it('results in error if no session ID provided', function (done) {
    mockStartBroadcastRequest(SESSIONID);
    opentok.startBroadcast(null, options, function (err) {
      expect(err.message).to.equal('No sessionId given to startBroadcast');
      done();
    });
  });

  it('results in error if no options provided', function (done) {
    mockStartBroadcastRequest(SESSIONID);
    opentok.startBroadcast(SESSIONID, null, function (err) {
      expect(err.message).to.equal('No options given to startBroadcast');
      done();
    });
  });

  it('results in error a response other than 200', function (done) {
    mockStartBroadcastRequest(SESSIONID, 400);
    opentok.startBroadcast(SESSIONID, options, function (err, broadcast) {
      expect(err).not.to.be.null;
      expect(broadcast).to.be.undefined;
      done();
    });
  });
});

describe('#stopBroadcast', function () {
  var opentok = new OpenTok('APIKEY', 'APISECRET');
  var BROADCAST_ID = 'BROADCAST_ID';

  function mockStopBroadcastRequest(broadcastId, status) {
    var body;
    if (status) {
      body = JSON.stringify({
        message: 'error message'
      });
    }
    else {
      body = JSON.stringify(mockBroadcastObject);
    }
    nock('https://api.opentok.com')
      .post('/v2/project/APIKEY/broadcast/' + broadcastId + '/stop')
      .reply(status || 200, body);
  }

  afterEach(function () {
    nock.cleanAll();
  });

  it('succeeds given valid parameters', function (done) {
    mockStopBroadcastRequest(BROADCAST_ID);
    opentok.stopBroadcast(BROADCAST_ID, function (err, broadcast) {
      expect(err).to.be.null;
      validateBroadcastObject(broadcast);
      done();
    });
  });

  it('results in error if no broadcastId provided', function (done) {
    mockStopBroadcastRequest();
    opentok.stopBroadcast(null, function (err, broadcast) {
      expect(err.message).to.equal('No broadcast ID given');
      expect(broadcast).to.be.undefined;
      done();
    });
  });

  it('results in error a response other than 200', function (done) {
    mockStopBroadcastRequest(BROADCAST_ID, 400);
    opentok.stopBroadcast(BROADCAST_ID, function (err, broadcast) {
      expect(err).not.to.be.null;
      expect(broadcast).to.be.undefined;
      done();
    });
  });
});

describe('#getBroadcast', function () {
  var opentok = new OpenTok('APIKEY', 'APISECRET');
  var BROADCAST_ID = 'BROADCAST_ID';

  function mockGetBroadcastRequest(broadcastId, status) {
    var body;
    if (status) {
      body = JSON.stringify({
        message: 'error message'
      });
    }
    else {
      body = JSON.stringify(mockBroadcastObject);
    }
    nock('https://api.opentok.com')
      .post('/v2/project/APIKEY/broadcast/' + broadcastId + '/stop')
      .reply(status || 200, body);
  }

  afterEach(function () {
    nock.cleanAll();
  });

  it('succeeds given valid parameters', function (done) {
    mockGetBroadcastRequest(BROADCAST_ID);
    opentok.stopBroadcast(BROADCAST_ID, function (err, broadcast) {
      expect(err).to.be.null;
      validateBroadcastObject(broadcast);
      done();
    });
  });

  it('results in error if no broadcastId provided', function (done) {
    mockGetBroadcastRequest();
    opentok.getBroadcast(null, function (err, broadcast) {
      expect(err.message).to.equal('No broadcast ID given');
      expect(broadcast).to.be.undefined;
      done();
    });
  });

  it('results in error if no callback method provided', function (done) {
    mockGetBroadcastRequest(BROADCAST_ID);
    try {
      opentok.getBroadcast(BROADCAST_ID);
    }
    catch (err) {
      expect(err.message).to.equal('No callback given to getBroadcast');
      done();
    }
  });

  it('results in error a response other than 200', function (done) {
    mockGetBroadcastRequest(BROADCAST_ID, 400);
    opentok.stopBroadcast(BROADCAST_ID, function (err, broadcast) {
      expect(err).not.to.be.null;
      expect(broadcast).to.be.undefined;
      done();
    });
  });
});

describe('#listBroadcasts', function () {
  var opentok = new OpenTok('APIKEY', 'APISECRET');
  var options = {
    sessionId: 'SESSIONID'
  };
  afterEach(function () {
    nock.cleanAll();
  });
  it('succeeds given valid parameters', function (done) {
    mockListBroadcastsRequest();
    opentok.listBroadcasts(function (err, broadcastList, totalCount) {
      expect(err).to.be.null;
      validateListBroadcastsObject(broadcastList);
      validateTotalCount(totalCount);
      done();
    });
  });

  it('succeeds given options as valid parameters', function (done) {
    mockListBroadcastsRequest({
      sessionId: 'SESSIONID'
    });
    opentok.listBroadcasts(options, function (err, broadcastList, totalCount) {
      expect(err).to.be.null;
      validateListBroadcastsObject(broadcastList);
      validateTotalCount(totalCount);
      done();
    });
  });

  it('results in error if no callback method provided', function (done) {
    mockListBroadcastsRequest();
    try {
      opentok.listBroadcasts();
    }
    catch (err) {
      expect(err.message).to.equal('No callback given to listBroadcasts');
      done();
    }
  });

  it('results in error a response other than 200', function (done) {
    mockListBroadcastsRequest(400);
    opentok.listBroadcasts(options, function (err, broadcastList, totalCount) {
      expect(err).not.to.be.null;
      expect(broadcastList).to.be.undefined;
      expect(totalCount).to.be.undefined;
      done();
    });
  });
});


describe('#setBroadcastLayout', function () {
  var opentok = new OpenTok('APIKEY', 'APISECRET');
  var BROADCAST_ID = 'BROADCAST_ID';
  var LAYOUT_TYPE = 'custom';
  var STYLESHEET = 'stylesheet';

  function mockSetBroadcastLayout(broadcastId, status) {
    var body;
    if (status) {
      body = JSON.stringify({
        message: 'error message'
      });
    }
    nock('https://api.opentok.com')
      .put('/v2/project/APIKEY/broadcast/' + broadcastId + '/layout')
      .reply(status || 200, body);
  }

  afterEach(function () {
    nock.cleanAll();
  });

  it('succeeds given valid parameters', function (done) {
    mockSetBroadcastLayout(BROADCAST_ID);
    opentok.setBroadcastLayout(BROADCAST_ID, LAYOUT_TYPE, STYLESHEET, function (err) {
      expect(err).to.be.null;
      done();
    });
  });
});

describe('getStream', function () {
  var opentok = new OpenTok('APIKEY', 'APISECRET');
  var SESSIONID = '1_MX4xMDB-MTI3LjAuMC4xflR1ZSBKYW4gMjggMTU6NDg6NDAgUFNUIDIwMTR-MC43NjAyOTYyfg';
  var STREAMID = '4072fe0f-d499-4f2f-8237-64f5a9d936f5';

  afterEach(function () {
    nock.cleanAll();
  });

  describe('valid responses', function () {
    it('should not get an error and get valid stream data given valid parameters', function (done) {
      mockStreamRequest(SESSIONID, STREAMID);
      opentok.getStream(SESSIONID, STREAMID, function (err, stream) {
        expect(err).to.be.null;
        expect(stream.id).to.equal('fooId');
        expect(stream.name).to.equal('fooName');
        expect(stream.layoutClassList.length).to.equal(1);
        expect(stream.layoutClassList[0]).to.equal('fooClass');
        expect(stream.videoType).to.equal('screen');
        done();
      });
    });

    it('should return an error if sessionId is null', function (done) {
      mockStreamRequest(SESSIONID, STREAMID);
      opentok.getStream(null, STREAMID, function (err, stream) {
        expect(err).to.not.be.null;
        expect(stream).to.be.undefined;
        done();
      });
    });

    it('should return an error if streamId is null', function (done) {
      mockStreamRequest(SESSIONID, STREAMID);
      opentok.getStream(SESSIONID, null, function (err, stream) {
        expect(err).to.not.be.null;
        expect(stream).to.be.undefined;
        done();
      });
    });

    it('should return an error if the REST method returns a 404 response code', function (done) {
      mockStreamRequest(SESSIONID, STREAMID, 400);
      opentok.getStream(SESSIONID, STREAMID, function (err, stream) {
        expect(err).to.not.be.null;
        expect(stream).to.be.undefined;
        done();
      });
    });
  });
});

describe('listStreams', function () {
  var opentok = new OpenTok('123456', 'APISECRET');
  var SESSIONID = '1_MX4xMDB-MTI3LjAuMC4xflR1ZSBKYW4gMjggMTU6NDg6NDAgUFNUIDIwMTR-MC43NjAyOTYyfg';

  afterEach(function () {
    nock.cleanAll();
  });

  describe('valid responses', function () {
    it('should not get an error and get valid stream data given valid parameters', function (done) {
      mockListStreamsRequest(SESSIONID);
      opentok.listStreams(SESSIONID, function (err, streams) {
        var stream = streams[0];
        expect(err).to.be.null;
        expect(stream.id).to.equal('fooId');
        expect(stream.name).to.equal('fooName');
        expect(stream.layoutClassList.length).to.equal(1);
        expect(stream.layoutClassList[0]).to.equal('fooClass');
        expect(stream.videoType).to.equal('screen');
        done();
      });
    });

    it('should return an error if sessionId is null', function (done) {
      opentok.listStreams(null, function (err, streams) {
        expect(err).to.not.be.null;
        expect(streams).to.be.undefined;
        done();
      });
    });

    it('should return an error if the REST method returns a 404 response code', function (done) {
      mockListStreamsRequest(SESSIONID, 400);
      opentok.listStreams(SESSIONID, function (err, streams) {
        expect(err).to.not.be.null;
        expect(streams).to.be.undefined;
        done();
      });
    });
  });
});
