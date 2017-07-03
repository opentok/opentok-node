/*global require, exports*/
/*jshint strict:false, eqnull:true */

var request = require('request');
var errors = require('./errors');
var pkg = require('../package.json');
var _ = require('lodash');
var generateJwt = require('./generateJwt');

/**
* An object representing an OpenTok callback.
* <p>
* Do not call the <code>new()</code> constructor. To create a callback, call the
* {@link OpenTok#registerCallback OpenTok.registerCallback()} method.
*
* @property {Number} createdAt
*   The time at which the callback was registered, in milliseconds since the UNIX epoch.
*
* @property {String} id
*   The callback ID.
*
* @property {String} group
*   The group of the archive. If no name was provided when the archive was created, this is set
*   to null.
*
* @see {@link OpenTok#registerCallback OpenTok.registerCallback()}
* @see {@link OpenTok#unregisterCallback OpenTok.unregisterCallback()}
* @see {@link OpenTok#getCallbacks OpenTok.getCallbacks()}
*
* @class Archive
*/
function Callback(config, properties) {
  var hasProp = {}.hasOwnProperty,
      id = properties.id,
      key;

  for (key in properties) {
    if (!hasProp.call(properties, key)) continue;
    this[key] = properties[key];
  }

  /**
  * Stops the recording of the archive.
  * <p>
  * Archives automatically stop recording after 120 minutes or when all clients have disconnected
  * from the session being archived.
  *
  * @param callback {Function} The function to call upon completing the operation. Two arguments
  * are passed to the function:
  *
  * <ul>
  *
  *   <li>
  *      <code>error</code> &mdash; An error object (if the call to the method fails).
  *   </li>
  *
  *   <li>
  *       <code>archive</code> &mdash; The Archive object.
  *   </li>
  *
  * </ul>
  *
  * @method #unregister
  * @memberof Callback
  */
  this.unregister = function(callback) {
    exports.unregister(config, id, callback);
  };
}

var api = function(config, method, path, body, callback) {
  var rurl = config.apiEndpoint + '/v2/project/' + config.apiKey + path;
  if ("defaults" in request) {
    request = request.defaults(_.pick(config, 'proxy', 'timeout'));
  }
  request({
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

exports.listCallbacks = function(config, options, callback) {
  if(typeof options == 'function') {
    callback = options;
    options = {};
  }
  if(typeof callback != 'function') {
    throw(new errors.ArgumentError('No callback given to listCallbacks'));
  }
  api(config, 'GET', '/callback', null, function(err, response, body) {
    if(!err && body ) {
      try {
        body = JSON.parse(body);
      } catch (_err) {
        err = _err;
      }
    }
    if(err || Math.floor(response.statusCode/100) != 2) {
      if(response && response.statusCode == 403) {
        callback(new errors.AuthError('Invalid API key or secret'));
      } else {
        callback(new errors.RequestError('Unexpected response from OpenTok'));
      }
    } else {
      callback(null, body.map(function(item){
        return new Callback(config, item);
      }));
    }
  });
};

exports.registerCallback = function(config, options, callback) {
  if(typeof options == 'function') {
    callback = options;
    options = {};
  }
  if(typeof callback != 'function') {
    throw(new errors.ArgumentError('No callback given to registerCallback'));
  }
  api(config, 'POST', '/callback', {
    group: options.group,
    event: options.event,
    url: options.url,
  }, function(err, response, body) {
    if(err) {
      callback(err);
    } else if(Math.floor(response.statusCode/100) != 2) {
      if(response && response.statusCode == 404) {
        callback(new errors.CallbackError('Callback event not found'));
      } else if(response && response.statusCode == 403) {
        callback(new errors.AuthError('Invalid API key or secret'));
      } else {
        callback(new errors.RequestError('Unexpected response from OpenTok'));
      }
    } else {
      callback(null, new Callback(config, body));
    }
  });
};

exports.unregisterCallback = function(config, callbackId, callback) {
  if(typeof callback != 'function') {
    throw(new errors.ArgumentError('No callback given to unregisterCallback'));
  }
  if(callbackId == null || callbackId.length === 0) {
    callback(new errors.ArgumentError('No callback ID given'));
    return;
  }
  api(config, 'DELETE', '/callback/' + encodeURIComponent(callbackId), {},
    function(err, response, body) {
    if(err) {
      callback(err);
    } else if(Math.floor(response.statusCode/100) != 2) {
      if(response && response.statusCode == 404) {
        callback(new errors.CallbackError('Callback not found'));
      } else if(response && response.statusCode == 403) {
        callback(new errors.AuthError('Invalid API key or secret'));
      } else {
        callback(new errors.RequestError('Unexpected response from OpenTok'));
      }
    } else {
      callback(null);
    }
  });
};
