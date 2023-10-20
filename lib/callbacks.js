var errors = require('./errors');
var pkg = require('../package.json');
var _ = require('lodash');
var generateJwt = require('./generateJwt');
const fetch = require('node-fetch');

var api = function (config, method, path, body, callback) {
  var rurl = config.apiEndpoint + '/v2/project/' + config.apiKey + path;
  const headers = {
    'X-OPENTOK-AUTH': generateJwt(config),
    'User-Agent': 'OpenTok-Node-SDK/' + pkg.version
        + (config.uaAddendum ? ' ' + config.uaAddendum : '')
  };

  if (body && ['POST', 'PATCH', 'PUT'].includes(method)) {
    headers['Content-Type'] = 'application/json';
  }

  Promise.resolve(fetch(
    rurl,
    {
      method: method,
      body: body ? JSON.stringify(body) : null,
      headers: headers,
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

function Callback(config, properties) {
  var hasProp = {}.hasOwnProperty;
  var id = properties.id;
  var key;

  for (key in properties) {
    if (hasProp.call(properties, key)) this[key] = properties[key];
  }

  this.unregister = function (callback) {
    exports.unregister(config, id, callback);
  };
}

exports.listCallbacks = function (config, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  if (typeof callback !== 'function') {
    throw (new errors.ArgumentError('No callback given to listCallbacks'));
  }
  api(config, 'GET', '/callback', null, function (err, response, body) {
    if (err) {
      callback(err);
    }

    try {
      body = JSON.parse(body);
    }
    catch (_err) {
      err = _err;
    }

    switch (response.statusCode) {
      case 200:
        callback(null, body.map(function (item) {
          return new Callback(config, item);
        }));
        return;
      case 403:
        callback(new errors.AuthError('Invalid API key or secret'));
        return;
      default:
        callback(new errors.RequestError('Unexpected response from OpenTok: ' + JSON.stringify(body || { statusCode: response.statusCode, statusMessage: response.statusMessage })));
        return;
    }
  });
};

exports.registerCallback = function (config, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  if (typeof callback !== 'function') {
    throw (new errors.ArgumentError('No callback given to registerCallback'));
  }
  api(config, 'POST', '/callback', {
    group: options.group,
    event: options.event,
    url: options.url
  }, function apiCallback(err, response, body) {
    if (err) {
      callback(err);
      return;
    }

    switch(response.statusCode) {
      case 200:
        callback(null, new Callback(config, body));
        return;
      case 404:
        callback(new errors.CallbackError('Callback event not found'));
        return;
      case 403:
        callback(new errors.AuthError('Invalid API key or secret'));
        return;
      default:
        callback(new errors.RequestError('Unexpected response from OpenTok: ' + JSON.stringify(body || { statusCode: response.statusCode, statusMessage: response.statusMessage })));
    }
  });
};

exports.unregisterCallback = function (config, callbackId, callback) {
  if (typeof callback !== 'function') {
    throw (new errors.ArgumentError('No callback given to unregisterCallback'));
  }
  if (callbackId == null || callbackId.length === 0) {
    callback(new errors.ArgumentError('No callback ID given'));
    return;
  }
  api(
    config,
    'DELETE',
    '/callback/' + encodeURIComponent(callbackId),
    null,
    function (err, response, body) {
      if (err) {
        callback(err);
        return;
      }

      switch (response.statusCode) {
        case 204:
          callback(null);
          return;
        case 404:
          callback(new errors.CallbackError('Callback not found'));
          return;
        case 403:
          callback(new errors.AuthError('Invalid API key or secret'));
          return;
        default:
          callback(new errors.RequestError('Unexpected response from OpenTok: ' + JSON.stringify(body || {
            statusCode: response.statusCode,
            statusMessage: response.statusMessage
          })));
      }
    }
  );
};
