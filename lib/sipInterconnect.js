/*global require, exports*/
/*jshint strict:false, eqnull:true */

var request = require('request'),
    errors  = require('./errors'),
    pkg     = require('../package.json'),
    _       = require('underscore');

/**
* An object representing an OpenTok SIP call.
* <p>
* Do not call the <code>new()</code> constructor. To start a SIP call, call the
* {@link OpenTok#dial OpenTok.dial()} method.
*
* @property {String} id
*   The unique ID of the SIP conference.
*
* @property {String} connectionId
*   The connection ID of the audio-only stream that is put into an OpenTok Session.
*
* @property {String} streamId
*   The stream ID of the audio-only stream that is put into an OpenTok Session.
*
* @property {String} projectId
*   The API key that was used to initiate the SIP call.
*
* @property {String} sessionId
*   The session ID that the SIP call was added to.
*
* @property {String} createdAt
*   The time the audio stream of the SIP call was created.
*
* @property {String} updatedAt
*   The last time the audio stream of the SIP call was updated.
*
* @see {@link OpenTok#dial OpenTok.dial()}
*
* @class SipInterconnect
*/
function SipInterconnect(config, properties) {
  var hasProp = {}.hasOwnProperty,
      id = properties.id,
      key;

  for (key in properties) {
    if (!hasProp.call(properties, key)) continue;
    this[key] = properties[key];
  }

  /**
  * Starts a SIP call.
  * <p>
  * To disconnect the call use the moderation API from a client SDK or the cloud API.
  *
  * @param sessionId The session ID corresponding to the session to which the user will connect.
  *
  * @param token The token for the session ID with which the SIP user will use to connect.
  *
  * @param sipUri The sip URI the SIP Interconnect feature will dial.
  *
  * @param options {Object} An optional options object with the following properties:
  * <p>
  * <ul>
  *   <li>
  *     <code>headers</code> (Object) &mdash; Custom headers to be added to the SIP INVITE
  *     request iniated from OpenTok to the Third Party SIP Platform. All headers must start
  *     with the "X-" prefix, or a Bad Request (400) will be thrown.
  *   </li>
  *   <li>
  *     <code>auth</code> (Object) &mdash; The credentials to be used for HTTP Digest authentication
  *     in case this is required by the Third Party SIP Platform.
  *   <ul>
  *     <li> "username" -- The username to be used in the SIP INVITE.
  *     <li> "password" -- The password to be used in the SIP INVITE.
  *   </ul>
  *   </li>
  *   <li>
  *     <code>secure</code> (Boolean) &mdash; Whether the SIP call should be transmitted
  *     encrypted or not.
  *   </li>
  * </ul>
  */
}

var api = function(config, method, path, body, callback) {
  var rurl = config.apiEndpoint + '/v2/partner/' + config.apiKey + path;
  if ("defaults" in request) {
    request = request.defaults(_.pick(config, 'proxy', 'timeout'));
  }
  request({
    url: rurl,
    method: method,
    headers: {
      'X-TB-PARTNER-AUTH': config.apiKey + ':' + config.apiSecret,
      'User-Agent': 'OpenTok-Node-SDK/' + pkg.version +
        (config.uaAddendum ? ' ' + config.uaAddendum : '')
    },
    json: body
  }, callback);
};

exports.dial = function(config, sessionId, token, sipUri, options, callback) {
  if (typeof options == 'function') {
    callback = options;
    options = {};
  }
  if (typeof callback !== 'function') {
    throw(new errors.ArgumentError('No callback given to dial'));
  }
  if (sessionId == null || sessionId.length === 0) {
    callback(new errors.ArgumentError('No session ID given'));
    return;
  }
  if (token == null || token.length === 0) {
    callback(new errors.ArgumentError('No token given'));
    return;
  }
  if (sipUri == null || sipUri.length === 0) {
    callback(new errors.ArgumentError('No SIP URI given'));
    return;
  }
  var body = {
    sessionId: sessionId,
    token: token,
    sip: {
      uri: sipUri
    }
  };
  if (_.isObject(options.headers) && !_.isArray(options.headers)) {
    body.sip.headers = options.headers;
  };
  if (_.isObject(options.auth) && !_.isArray(options.auth)) {
    body.sip.auth = options.auth;
  };
  if (!!options.secure) {
    body.sip.secure = !!options.secure;
  }
  api(config, 'POST', '/call', body, function(err, response, body) {
    if (err) {
      callback(err);
    } else if (response.statusCode !== 200) {
      if (response && response.statusCode == 400) {
        if (body.message.indexOf('Bad SIP URI format') > -1) {
          callback(new errors.SipError('Bad SIP URI format, only uris with format ' +
            'sip:username@domain and optional transport paramater are supported.'));
        } else {
          callback(new errors.SipError('Session not found'));
        }
      } else if (response && response.statusCode == 403) {
        callback(new errors.AuthError('Invalid API key or secret'));
      } else if (response && response.statusCode == 409) {
        callback(new errors.SipError('Only Routed Sessions are allowed to initiate SIP '
          + 'Calls.'));
      } else {
        callback(new errors.RequestError('Unexpected response from OpenTok'));
      }
    } else {
      callback(null, new SipInterconnect(config, body));
    }
  });
};

//For testing suite with instanceof, do NOT use this
exports._constructor_ = SipInterconnect;
