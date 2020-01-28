/* global require, exports */
/* jshint strict:false, eqnull:true */

var request = require('request');
var errors = require('./errors');
var pkg = require('../package.json');
var _ = require('lodash');
var generateJwt = require('./generateJwt');

var api = function (config, method, session, connection, body, callback) {
  var rurl = config.apiEndpoint + '/v2/project/' + config.apiKey + '/session/' + session;
  if (connection) {
    rurl += '/connection/' + connection;
  }
  request.defaults(_.pick(config, 'proxy', 'timeout'))({
    url: rurl,
    method: method,
    headers: {
      'X-OPENTOK-AUTH': generateJwt(config),
      'User-Agent': 'OpenTok-Node-SDK/' + pkg.version +
        (config.uaAddendum ? ' ' + config.uaAddendum : '')
    },
    json: body
  }, callback);
};

exports.forceDisconnect = function (config, sessionId, connectionId, callback) {
  if (typeof callback !== 'function') {
    throw (new errors.ArgumentError('No callback given to signal'));
  }
  if (sessionId == null || connectionId == null) {
    return callback(new errors.ArgumentError('No sessionId or connectionId tiven to signal'));
  }
  return api(config, 'DELETE', sessionId, connectionId, null, function (err, response) {
    if (err || Math.floor(response.statusCode / 100) !== 2) {
      if (response && response.statusCode === 403) {
        callback(new errors.AuthError('Invalid API key or secret'));
      }
      else if (response && response.statusCode === 404) {
        callback(new errors.ForceDisconnectError('Session or Connection not found'));
      }
      else {
        callback(new errors.RequestError('Unexpected response from OpenTok'));
      }
    }
    else {
      callback(null);
    }
  });
};
