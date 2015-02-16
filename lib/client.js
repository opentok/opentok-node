var util = require('util'),
    requestRoot = require('request'),
    request = requestRoot,
    _ = require('lodash'),
    to_json = require('xmljson').to_json,
    package = require('../package.json'),
    defaultConfig = {
      apiKey: null,
      apiSecret: null,
      apiUrl: 'https://api.opentok.com',
      endpoints: {
        createSession: '/session/create'
      },
      request: {
        timeout: 20000 // 20 seconds
      }
    };

var Client = function(c) {
  this.c = {};
  this.config(_.defaults(c, defaultConfig));
};

Client.prototype.config = function(c) {
  _.merge(this.c, c);

  if ("request" in this.c) {
    request = requestRoot.defaults(this.c.request);
  }

  return this.c;
};

Client.prototype.createSession = function(opts, cb) {
  request.post({
    // TODO: only works while apiUrl is always up to the domain, without the ending slash
    url: this.c.apiUrl + this.c.endpoints.createSession,
    form: opts,
    headers: {
      'User-Agent': 'OpenTok-Node-SDK/' + package.version,
      'X-TB-PARTNER-AUTH': this.c.apiKey+':'+this.c.apiSecret
    }
  }, function(err, resp, body) {
    if (err) return cb(new Error('The request failed: '+err));

    // handle client errors
    if (resp.statusCode === 403) {
      return cb(new Error('An authentication error occurred: (' + resp.statusCode + ') ' + body));
    }

    // handle server errors
    if (resp.statusCode >= 500 && resp.statusCode <= 599) {
      return cb(new Error('A server error occurred: (' + resp.statusCode + ') ' + body));
    }

    to_json(body, function(err, json) {
      if (err) return cb(new Error('Could not parse XML: '+err));
      cb(null, json);
    });
  });
};

Client.prototype.startArchive = function() {
};

Client.prototype.stopArchive = function() {
};

Client.prototype.getArchive = function() {
};

Client.prototype.listArchives = function() {
};

Client.prototype.deleteArchive = function() {
};

module.exports = Client;
