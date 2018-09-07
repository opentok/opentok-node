var requestRoot = require('request');
var request = requestRoot;
var _ = require('lodash');
var generateJwt = require('./generateJwt');
var pkg = require('../package.json');
var Stream = require('./stream');
var defaultConfig = {
  apiKey: null,
  apiSecret: null,
  apiUrl: 'https://api.opentok.com',
  endpoints: {
    createSession: '/session/create',
    getStream: '/v2/project/<%apiKey%>/session/<%sessionId%>/stream/<%streamId%>',
    listStreams: '/v2/project/<%apiKey%>/session/<%sessionId%>/stream',
    setArchiveLayout: '/v2/project/<%apiKey%>/archive/<%archiveId%>/layout',
    setStreamClassLists: '/v2/project/<%apiKey%>/session/<%sessionId%>/stream',
    dial: '/v2/project/<%apiKey%>/dial'
  },
  request: {
    timeout: 20000 // 20 seconds
  },
  auth: {
    expire: 300
  }
};

var Client = function (c) {
  this.c = {};
  this.config(_.defaults(c, defaultConfig));
};

Client.prototype.config = function (c) {
  _.merge(this.c, c);
  if (this.c.endpoints && this.c.endpoints.dial && this.c.apiKey) {
    this.c.endpoints.dial = this.c.endpoints.dial.replace(/<%apiKey%>/g, this.c.apiKey);
  }
  if ('request' in this.c) {
    request = requestRoot.defaults(this.c.request);
  }

  return this.c;
};

Client.prototype.createSession = function (opts, cb) {
  request.post({
    // TODO: only works while apiUrl is always up to the domain, without the ending slash
    url: this.c.apiUrl + this.c.endpoints.createSession,
    form: opts,
    json: true,
    headers: this.generateHeaders()
  }, function (err, resp, body) {
    if (err) {
      return cb(new Error('The request failed: ' + err));
    }

    // handle client errors
    if (resp.statusCode === 403) {
      return cb(new Error('An authentication error occurred: (' + resp.statusCode + ') ' + JSON.stringify(body)));
    }

    // handle server errors
    if (resp.statusCode >= 500 && resp.statusCode <= 599) {
      return cb(new Error('A server error occurred: (' + resp.statusCode + ') ' + JSON.stringify(body)));
    }

    // check if the returned object is valid JSON
    if (typeof body !== 'object') {
      return cb(new Error('Server returned invalid JSON'));
    }

    return cb(null, body);
  });
};

Client.prototype.startArchive = function () {
};

Client.prototype.stopArchive = function () {
};

Client.prototype.getArchive = function () {
};

Client.prototype.listArchives = function () {
};

Client.prototype.deleteArchive = function () {
};

Client.prototype.setArchiveLayout = function setArchiveLayout(opts, cb) {
  var url = this.c.apiUrl + this.c.endpoints.setArchiveLayout.replace(/<%apiKey%>/g, this.c.apiKey)
    .replace(/<%archiveId%>/g, opts.archiveId);
  request.put({
    url: url,
    headers: this.generateHeaders(),
    json: true,
    body: {
      type: opts.type,
      stylesheet: opts.stylesheet || undefined
    }
  }, function requestCallback(err, resp, body) {
    if (err) {
      return cb(new Error('The request failed: ' + err));
    }
    if (resp.statusCode === 200) {
      return cb(null, body);
    }
    return cb(new Error('(' + resp.statusCode + ') ' + body.message));
  });
};

Client.prototype.setStreamClassLists = function setStreamClassLists(sessionId, classListArray, cb) {
  var url = this.c.apiUrl + this.c.endpoints.setStreamClassLists.replace(/<%apiKey%>/, this.c.apiKey)
    .replace(/<%sessionId%>/g, sessionId);
  request.put({
    url: url,
    headers: this.generateHeaders(),
    json: true,
    body: {
      items: classListArray
    }
  }, function requestCallback(err, resp, body) {
    if (err) return cb(new Error('The request failed: ' + err));
    // handle client errors
    switch (resp.statusCode) {
      case 200:
        return cb(null, body);
      case 400:
        return cb(new Error('Invalid session ID or stream ID (400).'));
      case 403:
        return cb(new Error('Invalid API key or secret (403).'));
      default:
        if (resp.statusCode >= 500 && resp.statusCode <= 599) {
          // handle server errors
          return cb(new Error('A server error occurred: (' + resp.statusCode + ') ' + body));
        }
    }
    return cb(new Error('An unexpected error occurred: (' + resp.statusCode + ') ' + JSON.stringify(body)));
  });
};

Client.prototype.dial = function (opts, cb) {
  request.post({
    // TODO: only works while apiUrl is always up to the domain, without the ending slash
    url: this.c.apiUrl + this.c.endpoints.dial,
    json: opts,
    headers: this.generateHeaders()
  }, function (err, resp, body) {
    if (err) return cb(new Error('The request failed: ' + err));
    // handle client errors
    if (resp.statusCode === 400) {
      return cb(new Error('Bad session ID, token, SIP credentials, or SIP URI (sip:user@domain.tld)'));
    }

    if (resp.statusCode === 403) {
      return cb(new Error('Invalid API key or secret'));
    }

    if (resp.statusCode === 409) {
      return cb(new Error('Only Routed Sessions are allowed to initiate SIP Calls.'));
    }

    // handle server errors
    if (resp.statusCode >= 500 && resp.statusCode <= 599) {
      return cb(new Error('A server error occurred: (' + resp.statusCode + ') ' + body));
    }

    // Parse data from server
    return cb(null, body);
  });
};

Client.prototype.getStream = function getStream(sessionId, streamId, cb) {
  var url = this.c.apiUrl + this.c.endpoints.getStream.replace(/<%apiKey%>/g, this.c.apiKey)
    .replace(/<%streamId%>/g, streamId)
    .replace(/<%sessionId%>/g, sessionId);
  request.get({
    url: url,
    headers: this.generateHeaders()
  }, function requestCallback(err, resp, body) {
    if (err) {
      return cb(new Error('The request failed: ' + err));
    }
    if (resp.statusCode === 200) {
      return cb(null, body);
    }
    return cb(new Error('(' + resp.statusCode + ') ' + body.message));
  });
};

Client.prototype.listStreams = function listStreams(sessionId, cb) {
  var url = this.c.apiUrl + this.c.endpoints.listStreams
    .replace(/<%apiKey%>/g, this.c.apiKey)
    .replace(/<%sessionId%>/g, sessionId);
  request.get({
    url: url,
    headers: this.generateHeaders()
  }, function requestCallback(err, resp, body) {
    if (err) {
      return cb(new Error('The request failed: ' + err));
    }
    if (resp.statusCode === 200) {
      return cb(null, JSON.parse(body).items.map(function itemIterator(item) {
        return new Stream(JSON.stringify(item));
      }));
    }
    return cb(new Error('(' + resp.statusCode + ') ' + body.message));
  });
};

Client.prototype.generateHeaders = function () {
  return {
    'User-Agent': 'OpenTok-Node-SDK/' + pkg.version + (this.c.uaAddendum ? ' ' + this.c.uaAddendum : ''),
    'X-OPENTOK-AUTH': generateJwt(this.c),
    Accept: 'application/json'
  };
};

module.exports = Client;
