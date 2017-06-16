var requestRoot = require('request');
var request = requestRoot;
var _ = require('lodash');
var jwt = require('jsonwebtoken');
var pkg = require('../package.json');
var defaultConfig = {
  apiKey: null,
  apiSecret: null,
  apiUrl: 'https://api.opentok.com',
  endpoints: {
    createSession: '/session/create',
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
  if (c.endpoints && c.endpoints.dial && c.apiKey) {
    c.endpoints.dial = c.endpoints.dial.replace(/<%apiKey%>/g, c.apiKey);
  }
  _.merge(this.c, c);

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
    headers: this._generateHeaders()
  }, function (err, resp, body) {
    if (err) {
      return cb(new Error('The request failed: ' + err));
    }

    // handle client errors
    if (resp.statusCode === 403) {
      return cb(new Error(
        'An authentication error occurred: (' + resp.statusCode + ') ' + JSON.stringify(body)
      ));
    }

    // handle server errors
    if (resp.statusCode >= 500 && resp.statusCode <= 599) {
      return cb(new Error(
        'A server error occurred: (' + resp.statusCode + ') ' + JSON.stringify(body)
      ));
    }

    // check if the returned object is valid JSON
    if (typeof body !== 'object') {
      return cb(new Error('Server returned invalid JSON'));
    }

    cb(null, body);
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

Client.prototype.dial = function (opts, cb) {
  request.post({
    // TODO: only works while apiUrl is always up to the domain, without the ending slash
    url: this.c.apiUrl + this.c.endpoints.dial,
    json: opts,
    headers: this._generateHeaders()
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
    cb(null, body);
  });
};

Client.prototype._generateHeaders = function () {
  return {
    'User-Agent': 'OpenTok-Node-SDK/' + pkg.version + (this.c.uaAddendum ? ' ' + this.c.uaAddendum : ''),
    'X-OPENTOK-AUTH': this._generateJwt(),
    Accept: 'application/json'
  };
};

Client.prototype._generateJwt = function () {
  var currentTime = Math.floor(new Date() / 1000);
  var token = jwt.sign({
    iss: this.c.apiKey,
    ist: 'project',
    iat: currentTime,
    exp: currentTime + defaultConfig.auth.expire
  }, this.c.apiSecret);

  return token;
};

module.exports = Client;
