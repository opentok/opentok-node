var errors = require('./errors');
var pkg = require('../package.json');
var _ = require('lodash');
var generateJwt = require('./generateJwt');
const fetch = require('node-fetch');

var api = function (config, method, session, connection, body, callback) {
  var rurl = config.apiEndpoint + '/v2/project/' + config.apiKey + '/session/' + session;
  if (connection) {
    rurl += '/connection/' + connection;
  }
  rurl += '/signal';
  const requestHeaders = {
    'X-OPENTOK-AUTH': generateJwt(config),
    'User-Agent': 'OpenTok-Node-SDK/' + pkg.version
        + (config.uaAddendum ? ' ' + config.uaAddendum : '')
  };

  if (body && ['POST', 'PATCH', 'PUT'].includes(method)) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  Promise.resolve(fetch(
    rurl,
    {
      method: method,
      body: body ? JSON.stringify(body) : null,
      headers: requestHeaders,
    }
  ))
    .then(async (response) => {
      const otResponse = {
        statusCode: response.status,
      }
      let body = await response.text();

      try {
        body = JSON.parse(body)
      } catch (error) {

      }

      callback(null, otResponse, body)
    })
    .catch(async (error) => {
      callback(error);
    });
};

exports.signal = function (config, sessionId, connectionId, payload, callback) {
  var options;
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  if (typeof callback !== 'function') {
    throw (new errors.ArgumentError('No callback given to signal'));
  }
  if (sessionId == null || payload == null) {
    return callback(new errors.ArgumentError('No sessionId or payload given to signal'));
  }
  return api(config, 'POST', sessionId, connectionId, payload, function (err, response, body) {
    if (err || Math.floor(response.statusCode / 100) !== 2) {
      if (response && response.statusCode === 403) {
        callback(new errors.AuthError('Invalid API key or secret'));
      }
      else if (response && response.statusCode === 404) {
        callback(new errors.SignalError('Session or Connection not found'));
      }
      else {
        callback(new errors.RequestError('Unexpected response from OpenTok: ' + JSON.stringify(body || { statusCode: response.statusCode, statusMessage: response.statusMessage })));
      }
    }
    else {
      callback(null);
    }
  });
};
